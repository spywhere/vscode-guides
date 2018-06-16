"use strict";
import * as vscode from "vscode";
import * as request from "request";
import * as querystring from "querystring";
import * as path from "path";

export function activate(context: vscode.ExtensionContext) {
    let guides = new Guides();
    context.subscriptions.push(new GuidesController(guides));
    context.subscriptions.push(guides);
}

interface ActionItem extends vscode.MessageItem {
    action?: () => void;
}

class GuidesController {
    private guides: Guides;
    private disposable: vscode.Disposable;
    private lastSelection: vscode.Selection;

    constructor(guides: Guides){
        this.guides = guides;
        this.guides.reset();

        let subscriptions: vscode.Disposable[] = [];
        vscode.window.onDidChangeTextEditorSelection(
            (event) => this.updateSelection(
                event,
                guides.lineLimit < 0
            ),
            this, subscriptions
        );
        vscode.window.onDidChangeActiveTextEditor(
            this.updateActiveEditor, this, subscriptions
        );
        vscode.window.onDidChangeTextEditorOptions(
            this.updateEditorSettings, this, subscriptions
        );
        vscode.workspace.onDidChangeConfiguration(
            this.updateEditors, this, subscriptions
        );

        this.disposable = vscode.Disposable.from(...subscriptions);
    }

    dispose(){
        this.disposable.dispose();
    }

    private updateSelection(
        event: vscode.TextEditorSelectionChangeEvent,
        enableRelativeSelection: boolean
    ){
        let shouldUpdate = true;
        if(event.selections.length === 1){
            let selection = event.selections[0];
            let textLine = event.textEditor.document.lineAt(
                selection.active.line
            );

            if(
                this.lastSelection &&
                ((
                    // If the cursor is on the same line and placed after the
                    //   first non-whitespace character, but not on the
                    //   last character
                    selection.active.line === this.lastSelection.active.line &&
                    selection.active.character !== textLine.text.length &&
                    textLine.firstNonWhitespaceCharacterIndex <
                    selection.active.character - 1
                ) || (
                    // If the cursor just move to the line above/below and the
                    //   first non-whitespace character position of the both
                    //   lines are the same
                    Math.abs(
                        selection.active.line - this.lastSelection.active.line
                    ) === 1 &&
                    textLine.firstNonWhitespaceCharacterIndex ===
                    event.textEditor.document.lineAt(
                        this.lastSelection.active.line
                    ).firstNonWhitespaceCharacterIndex &&
                    enableRelativeSelection
                ))
            ){
                shouldUpdate = false;
            }
            this.lastSelection = selection;
        }
        if(shouldUpdate){
            this.guides.setNeedsUpdateEditor(event.textEditor);
        }
    }

    private updateEditorSettings(event: vscode.TextEditorOptionsChangeEvent){
        this.guides.updateFallbackIndentSize(event.options.tabSize as number);
        this.guides.setNeedsUpdateEditor(event.textEditor);
    }

    private updateActiveEditor(editor: vscode.TextEditor){
        this.guides.setNeedsUpdateEditor(editor);
    }

    private updateEditors(){
        this.guides.reset();
    }
}

interface OptionVariant<T> {
    baseValue: T;
    darkValue: T;
    lightValue: T;
}

interface GuidesBackground {
    level: number;
    range: vscode.Range;
}

interface GuidesRange {
    indentGuideRanges: vscode.Range[];
    indentBackgrounds: GuidesBackground[];
    activeLevel: number;
    activeGuideRange: vscode.Range;
    stackGuideRanges: vscode.Range[];
    maxLevel: number;
    topActive: boolean;
    bottomActive: boolean;
}

class Guides {
    private enabled = true;
    private gutterOpenDecor?: vscode.TextEditorDecorationType;
    private gutterCloseDecor?: vscode.TextEditorDecorationType;
    private indentGuideDecor?: vscode.TextEditorDecorationType;
    private activeGuideDecor?: vscode.TextEditorDecorationType;
    private stackGuideDecor?: vscode.TextEditorDecorationType;
    private indentBackgroundDecors?: Array<vscode.TextEditorDecorationType>;

    private hasShowSuggestion = {
        guide: false
    };

    private hasWarnDeprecation = {
        ruler: false,
        baseSettings: false
    };

    private configurations: vscode.WorkspaceConfiguration;

    private startupTimer = Date.now();
    private startupStop?: number;
    private retryTimer = Date.now();
    private retryDuration = 300;
    private timerDelay = 0.1;
    private updateTimer?: NodeJS.Timer;
    private sendStats = false;
    private fallbackIndentSize = 4;
    lineLimit = 500;

    updateFallbackIndentSize(indentSize: number){
        this.fallbackIndentSize = indentSize || 4;
    }

    reset(){
        this.clearEditorsDecorations();
        this.dispose();
        this.loadSettings();
        this.updateEditors();
    }

    dispose(){
        if(this.updateTimer !== undefined){
            clearTimeout(this.updateTimer);
        }
        if(this.gutterOpenDecor){
            this.gutterOpenDecor.dispose();
        }
        if(this.gutterCloseDecor){
            this.gutterCloseDecor.dispose();
        }
        if(this.indentGuideDecor){
            this.indentGuideDecor.dispose();
        }
        if(this.activeGuideDecor){
            this.activeGuideDecor.dispose();
        }
        if(this.stackGuideDecor){
            this.stackGuideDecor.dispose();
        }
    }

    handleMessage(promise: Thenable<ActionItem>){
        promise.then((item) => {
            if (!item) {
                return;
            }
            if (item.action) {
                item.action();
                this.updateEditors();
            }
        });
    }

    loadSettings(){
        this.configurations = vscode.workspace.getConfiguration("guides");
        this.enabled = this.configurations.get<boolean>("enabled");

        this.sendStats = !this.configurations.get<boolean>(
            "sendUsagesAndStats"
        );

        this.lineLimit = this.configurations.get<number>("limit.maximum");

        let indentSettingNames = [{
            name: "renderIndentGuides",
            major: 1,
            minor: 3,
            patch: 0
        }, {
            name: "indentGuides",
            major: 1,
            minor: 0,
            patch: 1
        }];

        let editorConfigurations = vscode.workspace.getConfiguration(
            "editor",
            vscode.window.activeTextEditor ?
            vscode.window.activeTextEditor.document.uri : undefined
        );

        let lastIndex = 0;
        let overrideStyle  = !this.configurations.get<boolean>(
            "overrideDefault"
        ) && indentSettingNames.some(
            (settings, index) => {
                lastIndex = index;
                return editorConfigurations.get<boolean>(
                    settings.name, false
                ) && this.isEqualOrNewerVersionThan(
                    settings.major, settings.minor, settings.patch
                );
            }
        );

        if(
            this.enabled &&
            overrideStyle &&
            !this.hasShowSuggestion.guide
        ){
            let settings = indentSettingNames[lastIndex];
            this.hasShowSuggestion.guide = true;
            this.handleMessage(vscode.window.showWarningMessage<ActionItem>(
                "Guides extension has detected that you are using " +
                "\"editor." + settings.name + "\" settings. " +
                "Guides will now disable all indentation guides by "+
                "override the style to \"none\".", {
                    title: "Use Guides",
                    action: () => {
                        editorConfigurations.update(
                            settings.name, false,
                            vscode.ConfigurationTarget.Global
                        );
                    },
                    isCloseAffordance: true
                }, {
                    title: "Use built-in",
                    isCloseAffordance: true
                }, {
                    title: "Always use built-in",
                    action: () => {
                        vscode.workspace.getConfiguration("guides").update(
                            "enabled", false, vscode.ConfigurationTarget.Global
                        );
                    },
                    isCloseAffordance: true
                }
            ));
        }

        this.timerDelay = this.configurations.get<number>("updateDelay");
        this.indentBackgroundDecors = [];
        this.configurations.get<string[]>(
            "normal.backgrounds",
            this.configurations.get<string[]>(
                "indent.backgrounds"
            )
        ).forEach((backgroundColor) => {
            this.indentBackgroundDecors.push(
                vscode.window.createTextEditorDecorationType({
                    backgroundColor: backgroundColor
                })
            );
        });

        this.indentGuideDecor = this.createTextEditorDecorationFromKey(
            "normal",
            !this.enabled || overrideStyle || !this.configurations.get<boolean>(
                "normal.enabled"
            )
        );
        this.activeGuideDecor = this.createTextEditorDecorationFromKey(
            "active",
            !this.enabled || overrideStyle || !this.configurations.get<boolean>(
                "active.enabled"
            )
        );
        this.stackGuideDecor = this.createTextEditorDecorationFromKey(
            "stack",
            !this.enabled || overrideStyle || !this.configurations.get<boolean>(
                "stack.enabled"
            )
        );

        if (
            this.enabled &&
            !overrideStyle &&
            !this.indentGuideDecor &&
            !this.activeGuideDecor &&
            !this.stackGuideDecor
        ) {
            vscode.window.showWarningMessage(
                "Guides extension has detected that there is no " +
                "indentation guide enabled, either by disable or set the " +
                "style to \"none\"."
            );
        }

        if (this.enabled && this.configurations.get<boolean>("active.gutter")) {
            this.gutterOpenDecor = vscode.window.createTextEditorDecorationType(
                {
                    light: {
                        gutterIconPath: path.join(
                            __dirname, "..", "gutters", "open-light.svg"
                        ),
                    },
                    dark: {
                        gutterIconPath: path.join(
                            __dirname, "..", "gutters", "open-dark.svg"
                        ),
                    },
                    gutterIconSize: "contain"
                }
            );
            this.gutterCloseDecor = vscode.window.createTextEditorDecorationType(
                {
                    light: {
                        gutterIconPath: path.join(
                            __dirname, "..", "gutters", "close-light.svg"
                        ),
                    },
                    dark: {
                        gutterIconPath: path.join(
                            __dirname, "..", "gutters", "close-dark.svg"
                        ),
                    },
                    gutterIconSize: "contain"
                }
            );
        }

        if(
            this.configurations.get<number[]>("rulers", []).length > 0 &&
            !this.hasWarnDeprecation.ruler
        ){
            this.hasWarnDeprecation.ruler = true;
            vscode.window.showWarningMessage(
                "Guides extension no longer supports ruler since Visual " +
                "Studio Code has built-in ruler feature. Guides extension " +
                "kindly suggests that you use built-in feature "+
                "rather than using this extension."
            );
        }
    }

    createTextEditorDecorationFromKey(settingsKey: string, overrideStyle=false){
        let borderStyle = this.configurations.get<string>(
            settingsKey + ".style"
        ).trim();

        if(overrideStyle || borderStyle.toLowerCase() === "none"){
            return undefined;
        }

        let options: vscode.DecorationRenderOptions = {
            borderWidth: `0px 0px 0px ${
                this.configurations.get<number>(settingsKey + ".width")
            }px`,
            borderStyle: borderStyle
        };

        let colorVariant = this.getOptionVariants(settingsKey + ".color");

        options.borderColor = colorVariant.baseValue;
        if(colorVariant.darkValue){
            options.dark = {
                borderColor: colorVariant.darkValue
            };
        }
        if(colorVariant.lightValue){
            options.light = {
                borderColor: colorVariant.lightValue
            };
        }
        return vscode.window.createTextEditorDecorationType(options);
    }

    getOptionVariants(settingsKey: string) : OptionVariant<string> {
        let darkValue = this.configurations.get<string>(
            settingsKey + ".dark"
        );
        let lightValue = this.configurations.get<string>(
            settingsKey + ".light"
        );
        return {
            baseValue: lightValue || darkValue,
            darkValue: darkValue,
            lightValue: lightValue
        };
    }

    clearEditorsDecorations(){
        vscode.window.visibleTextEditors.forEach((editor) => {
            if(this.indentBackgroundDecors){
                this.indentBackgroundDecors.forEach((decoration) => {
                    editor.setDecorations(decoration, []);
                });
            }
            if(this.gutterOpenDecor){
                editor.setDecorations(this.gutterOpenDecor, []);
            }
            if(this.gutterCloseDecor){
                editor.setDecorations(this.gutterCloseDecor, []);
            }
            if(this.indentGuideDecor){
                editor.setDecorations(this.indentGuideDecor, []);
            }
            if(this.activeGuideDecor){
                editor.setDecorations(this.activeGuideDecor, []);
            }
            if(this.stackGuideDecor){
                editor.setDecorations(this.stackGuideDecor, []);
            }
        });
    }

    setNeedsUpdateEditor(editor: vscode.TextEditor){
        if(this.updateTimer !== undefined){
            return;
        }
        this.updateTimer = setTimeout(() => {
            this.updateTimer = undefined;
            this.updateEditor(editor);
        }, this.timerDelay * 1000);
    }

    updateEditors(){
        vscode.window.visibleTextEditors.forEach((editor) => {
            this.updateEditor(editor);
        });
    }

    updateEditor(editor: vscode.TextEditor){
        if(!this.sendStats){
            this.sendStats = true;
            this.sendUsagesAndStats();
        }
        // If no editor set, do nothing
        //   This can occur when active editor is not set
        if(!this.enabled || !editor){
            return;
        }

        let indentGuideRanges: vscode.Range[] = [];
        let indentBackgrounds: any[] = [];
        let activeGuideRanges: vscode.Range[] = [];
        let stackGuideRanges: vscode.Range[] = [];
        let maxLevel = this.indentBackgroundDecors.length;

        let cursorPosition = editor.selection.active;
        let primaryRanges = this.getRangesForLine(
            editor, cursorPosition.line, maxLevel
        );
        let lastTopActive = cursorPosition.line;
        let lastBottomActive = cursorPosition.line;
        let keepActive = (
            primaryRanges.activeLevel >= 0 &&
            primaryRanges.topActive &&
            editor.selection.isEmpty &&
            editor.selections.length == 1
        );
        let stillActive = (
            keepActive &&
            this.configurations.get<boolean>(
                "active.enabled"
            )
        );
        let shouldStack = (
            editor.selection.isEmpty &&
            editor.selections.length == 1 &&
            this.configurations.get<boolean>(
                "stack.enabled"
            )
        );
        indentGuideRanges.push(
            ...primaryRanges.indentGuideRanges
        );
        if(shouldStack){
            stackGuideRanges.push(
                ...primaryRanges.stackGuideRanges
            );
        }else{
            indentGuideRanges.push(
                ...primaryRanges.stackGuideRanges
            );
        }
        indentBackgrounds.push(
            ...primaryRanges.indentBackgrounds
        );
        if(primaryRanges.activeGuideRange){
            if(stillActive){
                activeGuideRanges.push(
                    primaryRanges.activeGuideRange
                );
            }else{
                indentGuideRanges.push(
                    primaryRanges.activeGuideRange
                );
            }
        }

        // Search through upper ranges
        let lastActiveLevel = primaryRanges.activeLevel;
        let lineLimit = this.lineLimit;

        if (lineLimit > 0 && lineLimit < 1) {
            lineLimit = (editor.document.lineCount / 2) * lineLimit;
        }

        let startLine = cursorPosition.line - 1;
        let endLine = 0;
        if (lineLimit >= 0) {
            endLine = Math.max(startLine - lineLimit + 1, 0);
        }

        for(let line = startLine; line >= endLine; line--){
            let ranges = this.getRangesForLine(
                editor, line, maxLevel,
                primaryRanges.activeLevel, lastActiveLevel
            );
            indentGuideRanges.push(
                ...ranges.indentGuideRanges
            );
            indentBackgrounds.push(
                ...ranges.indentBackgrounds
            );
            if(shouldStack){
                stackGuideRanges.push(
                    ...ranges.stackGuideRanges
                );
            }else{
                indentGuideRanges.push(
                    ...ranges.stackGuideRanges
                );
            }
            if(ranges.activeGuideRange){
                if(stillActive){
                    activeGuideRanges.push(
                        ranges.activeGuideRange
                    );
                }else{
                    indentGuideRanges.push(
                        ranges.activeGuideRange
                    );
                }
            }else if(primaryRanges.activeLevel !== ranges.activeLevel){
                if (lastTopActive > line && keepActive) {
                    lastTopActive = line;
                }
                keepActive = false;
                stillActive = false;
            }
            if(ranges.maxLevel > 0 && ranges.maxLevel < lastActiveLevel){
                lastActiveLevel = ranges.maxLevel;
            }
        }

        // Search through lower ranges
        keepActive = (
            primaryRanges.activeLevel >= 0 &&
            primaryRanges.bottomActive &&
            editor.selection.isEmpty &&
            editor.selections.length == 1
        );
        stillActive = (
            keepActive &&
            this.configurations.get<boolean>(
                "active.enabled"
            )
        );
        let totalLines = editor.document.lineCount;
        lastActiveLevel = primaryRanges.activeLevel;

        startLine = cursorPosition.line + 1;
        endLine = totalLines;
        if (lineLimit >= 0) {
            endLine = Math.min(startLine + lineLimit, totalLines);
        }

        for(let line = startLine; line < endLine; line++){
            let ranges = this.getRangesForLine(
                editor, line, maxLevel,
                primaryRanges.activeLevel, lastActiveLevel
            );
            indentGuideRanges.push(
                ...ranges.indentGuideRanges
            );
            indentBackgrounds.push(
                ...ranges.indentBackgrounds
            );
            if(shouldStack){
                stackGuideRanges.push(
                    ...ranges.stackGuideRanges
                );
            }else{
                indentGuideRanges.push(
                    ...ranges.stackGuideRanges
                );
            }
            if(ranges.activeGuideRange){
                if(stillActive){
                    activeGuideRanges.push(
                        ranges.activeGuideRange
                    );
                }else{
                    indentGuideRanges.push(
                        ranges.activeGuideRange
                    );
                }
            }else if(primaryRanges.activeLevel !== ranges.activeLevel){
                if (lastBottomActive < line && keepActive) {
                    lastBottomActive = line;
                }
                keepActive = false;
                stillActive = false;
            }
            if(ranges.maxLevel > 0 && ranges.maxLevel < lastActiveLevel){
                lastActiveLevel = ranges.maxLevel;
            }
        }

        this.indentBackgroundDecors.forEach((decoration, level) => {
            editor.setDecorations(decoration, indentBackgrounds.filter(
                (stopPoint) => {
                    return (
                        stopPoint.level % maxLevel === level
                    );
                }
            ).map((stopPoint) => {
                return stopPoint.range;
            }));
        });
        if(this.gutterOpenDecor){
            editor.setDecorations(
                this.gutterOpenDecor,
                (
                    lastTopActive !== lastBottomActive ?
                    [new vscode.Range(
                        lastTopActive, 0, lastTopActive, 0
                    )] : []
                )
            );
        }
        if(this.gutterCloseDecor){
            editor.setDecorations(
                this.gutterCloseDecor,
                (
                    lastTopActive !== lastBottomActive ?
                    [new vscode.Range(
                        lastBottomActive, 0, lastBottomActive, 0
                    )] : []
                )
            );
        }
        if(this.indentGuideDecor){
            editor.setDecorations(this.indentGuideDecor, indentGuideRanges);
        }
        if(this.activeGuideDecor){
            editor.setDecorations(this.activeGuideDecor, activeGuideRanges);
        }
        if(this.stackGuideDecor){
            editor.setDecorations(this.stackGuideDecor, stackGuideRanges);
        }
    }

    getRangesForLine(editor: vscode.TextEditor, lineNumber: number,
                     maxLevel: number, activeLevel: number = -1,
                     lastActiveLevel: number = -1) : GuidesRange {
        let activeGuideRange: vscode.Range | undefined;
        let indentGuideRanges: vscode.Range[] = [];
        let stackGuideRanges: vscode.Range[] = [];
        let indentBackgrounds: GuidesBackground[] = [];

        let guidelines = this.getGuides(
            editor.document.lineAt(lineNumber),
            editor.options.tabSize as number || this.fallbackIndentSize
        );
        let empty = guidelines === undefined;
        if(empty){
            guidelines = [];
        }
        let totalNonNormalGuides = 0;
        let topActive = false;
        let bottomActive = false;
        if(activeLevel === -1){
            for (let index = guidelines.length - 1; index >= 0; index--) {
                let guide = guidelines[index];
                if(guide.type === "normal"){
                    activeLevel = index;
                    if (
                        this.configurations.get<boolean>("active.extraIndent")
                    ) {
                        activeLevel += 1;
                    }
                    break;
                }else{
                    totalNonNormalGuides += 1;
                }
            }
            if(activeLevel < 0){
                activeLevel = -2;
            }else{
                activeLevel += totalNonNormalGuides;
            }

            let lineText = editor.document.lineAt(lineNumber).text;
            let position = editor.selection.active.character;
            let lastCharacter = (
                position <= lineText.length ?
                lineText[position - 1] : ""
            );

            if (
                activeLevel >= 0 &&
                this.configurations.get<boolean>("active.expandBrackets") &&
                lastCharacter !== ""
            ) {
                bottomActive = "([{".split("").some(character => {
                    return lineText[position - 1] === character;
                });
                topActive = "}])".split("").some(character => {
                    return lineText[position - 1] === character;
                });
                if (bottomActive || topActive) {
                    activeLevel += 1;
                }
            }
        }

        if(lastActiveLevel === -1){
            lastActiveLevel = activeLevel;
        }

        let lastPosition = new vscode.Position(lineNumber, 0);
        let normalGuideIndex = 0;
        guidelines.forEach((guideline, level) => {
            let position = new vscode.Position(lineNumber, guideline.position);
            let inSelection = editor.selections.some((selection) => {
                return selection.contains(position);
            });
            if(guideline.type === "normal" || guideline.type === "extra"){
                // Add background color stop points if there are colors
                if(maxLevel > 0 && (!inSelection || (
                    inSelection &&
                    !this.configurations.get<boolean>(
                        "indent.hideBackgroundOnSelection"
                    )
                ))){
                    indentBackgrounds.push({
                        level: level,
                        range: new vscode.Range(
                            lastPosition, position
                        )
                    });
                }
                let types = ["normal"];
                if (this.configurations.get<boolean>("active.extraIndent")) {
                    types.push("extra");
                }
                if(types.some(type => guideline.type === type)){
                    normalGuideIndex += 1;
                    if(normalGuideIndex === activeLevel && (
                        !inSelection || (inSelection &&
                            !this.configurations.get<boolean>(
                                "active.hideOnSelection"
                            )
                        )
                    )){
                        activeGuideRange = new vscode.Range(position, position);
                        topActive = true;
                        bottomActive = true;
                    }else if(normalGuideIndex < lastActiveLevel && (
                        !inSelection || (inSelection &&
                            !this.configurations.get<boolean>(
                                "stack.hideOnSelection"
                            )
                        )
                    )){
                        stackGuideRanges.push(
                            new vscode.Range(position, position)
                        );
                    }else if(normalGuideIndex !== activeLevel && (
                        !inSelection || (inSelection &&
                            !this.configurations.get<boolean>(
                                "normal.hideOnSelection"
                            )
                        )
                    )){
                        indentGuideRanges.push(
                            new vscode.Range(position, position)
                        );
                    }
                }
            }
            lastPosition = position;
        });

        if(!empty && !activeGuideRange && !topActive && !bottomActive){
            activeLevel = -1;
        }

        return {
            indentGuideRanges: indentGuideRanges,
            indentBackgrounds: indentBackgrounds,
            activeLevel: activeLevel,
            activeGuideRange: activeGuideRange,
            stackGuideRanges: stackGuideRanges,
            maxLevel: guidelines.length,
            topActive: topActive,
            bottomActive: bottomActive
        };
    }

    adjustRangesForLine(ranges: GuidesRange, lineNumber: number) : GuidesRange {
        return {
            indentGuideRanges: ranges.indentGuideRanges.map(guide => {
                return this.adjustRangeForLine(guide, lineNumber);
            }),
            indentBackgrounds: ranges.indentBackgrounds.map(background => {
                return {
                    level: background.level,
                    range: this.adjustRangeForLine(background.range, lineNumber)
                };
            }),
            activeLevel: ranges.activeLevel,
            activeGuideRange: this.adjustRangeForLine(
                ranges.activeGuideRange, lineNumber
            ),
            stackGuideRanges: ranges.stackGuideRanges.map(guide => {
                return this.adjustRangeForLine(guide, lineNumber);
            }),
            maxLevel: ranges.maxLevel,
            topActive: true,
            bottomActive: true
        };
    }

    adjustRangeForLine(range: vscode.Range, lineNumber: number){
        let start = new vscode.Position(lineNumber, range.start.character);
        let end = new vscode.Position(lineNumber, range.end.character);
        return new vscode.Range(start, end);
    }

    getGuides(line: vscode.TextLine, indentSize: number){
        if(line.isEmptyOrWhitespace){
            return undefined;
        }
        let pattern = new RegExp(
            ` {${indentSize}}| {0,${indentSize - 1}}\t`,
            "g"
        );
        let emptySpace = " ".repeat(indentSize);
        let guides = [];
        let whitespaces = line.text.substr(
            0, line.firstNonWhitespaceCharacterIndex
        );
        let singleMatch = whitespaces.match(pattern);

        if(!singleMatch || singleMatch.length == 0){
            return guides;
        }
        if(
            this.configurations.get<boolean>(
                "indent.showFirstIndentGuides"
            )
        ){
            guides.push({
                type: "normal",
                position: 0
            });
        }
        let index = 0;
        for(
            let indentLevel = 0;
            indentLevel < singleMatch.length;
            indentLevel++
        ){
            index += singleMatch[indentLevel].length;
            guides.push({
                type: (
                    index === line.firstNonWhitespaceCharacterIndex
                ) ? "extra" : "normal",
                position: index
            });
        }
        return guides;
    }

    sendUsagesAndStats(){
        if(this.startupStop === undefined){
            this.startupStop = Date.now();
        }
        if(this.retryTimer - Date.now() > 0){
            return;
        }
        console.log("[Guides] Sending usage statistics...");
        let startupTime = (this.startupStop - this.startupTimer) / 1000.0;
        let data = {
            "schema": 1,
            "name": "guides",
            "version": vscode.extensions.getExtension(
                "spywhere.guides"
            ).packageJSON["version"],
            "vscode_version": vscode.version,
            "platform": process.platform,
            "architecture": process.arch,
            "startup_time": parseFloat(startupTime.toFixed(3))
        };

        request({
            uri: "https://api.digitalparticle.com/guides",
            method: "POST",
            body: data,
            json: true
        }, (error, response, data) => {
            if(error){
                this.sendStats = false;
                console.log(
                    "[Guides] Error while sending usage statistics: " +
                    error
                );
            }else if(response.statusCode !== 200){
                this.sendStats = false;
                console.log(
                    "[Guides] Error while sending usage statistics: " +
                    "ErrorCode " + response.statusCode
                );
            }else if(!data || data["error"]){
                this.sendStats = false;
                console.log(
                    "[Guides] Error while sending usage statistics: " +
                    data
                );
            }else{
                console.log(
                    "[Guides] Usage statistics has successfully sent"
                );
            }
            if(!this.sendStats){
                this.retryTimer = Date.now() + this.retryDuration * 1000;
                console.log(
                    "[Guides] Usage statistics will retry in the next " +
                    (this.retryDuration / 60) +
                    " minutes"
                );
                this.retryDuration *= 2;
            }
        });
    }

    isEqualOrNewerVersionThan(major: number, minor: number, patch: number){
        let targetVersions = [major, minor, patch];
        let currentVersions = vscode.version.match(
            "\\d+\\.\\d+\\.\\d+"
        )[0].split(".").map((value)=>{
            return parseInt(value);
        });
        for (let index = 0; index < targetVersions.length; index++) {
            let targetVersion = targetVersions[index];
            let currentVersion = currentVersions[index];
            if(currentVersion < targetVersion){
                return false;
            }
        }
        return true;
    }
}
