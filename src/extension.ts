import * as vscode from 'vscode';
var process = require("process");
var request = require("request");
var querystring = require("querystring");

export function activate(context: vscode.ExtensionContext) {
    var guides = new Guides();
    context.subscriptions.push(new GuidesController(guides));
    context.subscriptions.push(guides);
}

class GuidesController {
    private guides: Guides;
    private disposable: vscode.Disposable;

    constructor(guides: Guides){
        this.guides = guides;
        this.guides.reset();

        let subscriptions: vscode.Disposable[] = [];
        vscode.window.onDidChangeTextEditorSelection(
            this.updateSelection, this, subscriptions
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

    private updateSelection(event: vscode.TextEditorSelectionChangeEvent){
        this.guides.setNeedsUpdateEditor(event.textEditor);
    }

    private updateEditorSettings(event: vscode.TextEditorOptionsChangeEvent){
        this.guides.setNeedsUpdateEditor(event.textEditor);
    }

    private updateActiveEditor(editor: vscode.TextEditor){
        this.guides.setNeedsUpdateEditor(editor);
    }

    private updateEditors(){
        this.guides.reset();
    }
}

class Guides {
    private indentGuideDecor: vscode.TextEditorDecorationType;
    private activeGuideDecor: vscode.TextEditorDecorationType;
    private rulerGuideDecor: vscode.TextEditorDecorationType;
    private indentBackgroundDecors: Array<vscode.TextEditorDecorationType>;

    private hasShowSuggestion = {
        "ruler": false,
        "guide": false
    };
    private hasWarnDeprecate = {
        "background": false,
        "width": false
    };

    private configurations: vscode.WorkspaceConfiguration;

    private startupTimer = Date.now();
    private startupStop = null;
    private timerDelay = 0.1;
    private updateTimer: number = null;
    private sendStats = false;

    reset(){
        this.clearEditorsDecorations();
        this.dispose();
        this.loadSettings();
        this.updateEditors();
    }

    dispose(){
        if(this.updateTimer !== null){
            clearTimeout(this.updateTimer);
        }
        if(this.indentGuideDecor){
            this.indentGuideDecor.dispose();
        }
        if(this.activeGuideDecor){
            this.activeGuideDecor.dispose();
        }
        if(this.rulerGuideDecor){
            this.rulerGuideDecor.dispose();
        }
    }

    loadSettings(){
        this.configurations = vscode.workspace.getConfiguration("guides");

        this.sendStats = !this.configurations.get<boolean>("sendUsagesAndStats");

        var overrideStyle = !this.configurations.get<boolean>(
            "overrideDefault"
        ) && vscode.workspace.getConfiguration("editor").get<boolean>(
            "indentGuides", false
        ) && this.isEqualOrNewerVersionThan(1, 0, 1);
        if(
            overrideStyle &&
            !this.hasShowSuggestion["guide"]
        ){
            this.hasShowSuggestion["guide"] = true;
            vscode.window.showWarningMessage(
                "Guides extension has detected that you are using " +
                "\"editor.indentGuides\" settings. " +
                "Guides will now disable all indentation guides by "+
                "override the style to \"none\"."
            );
        }

        this.timerDelay = this.configurations.get<number>("updateDelay");
        this.indentBackgroundDecors = [];
        if(
            this.configurations.has("normal.backgrounds") &&
            !this.hasWarnDeprecate["background"]
        ){
            this.hasWarnDeprecate["background"] = true;
            vscode.window.showWarningMessage(
                "Guides extension has detected that you are still using " +
                "\"guides.normal.backgrounds\" settings. " +
                "Please change the settings to "+
                "\"guides.indent.backgrounds\" instead."
            );
        }
        this.configurations.get<any>(
            "normal.backgrounds",
            this.configurations.get<any>(
                "indent.backgrounds"
            )
        ).forEach((backgroundColor) => {
            this.indentBackgroundDecors.push(
                vscode.window.createTextEditorDecorationType({
                    backgroundColor: backgroundColor
                })
            );
        });

        [
            "normal.width", "active.width", "ruler.width"
        ].some((settingKey) => {
            var hasWarn = this.hasWarnDeprecate["width"];
            var isString = typeof(
                this.configurations.get<any>(settingKey)
            ) === "string";
            if(isString && !hasWarn){
                this.hasWarnDeprecate["width"] = true;
                vscode.window.showWarningMessage(
                    "Guides extension has detected that you are still using " +
                    `\"guides.${settingKey}\" as a string. ` +
                    "Please change the setting's value to "+
                    "number instead."
                );
            }
            return !isString || hasWarn;
        });

        this.indentGuideDecor = vscode.window.createTextEditorDecorationType({
            borderWidth: `0px 0px 0px ${
                this.getValueAsNumber("normal.width")
            }px`,
            borderColor: this.configurations.get<string>("normal.color"),
            borderStyle: this.configurations.get<string>("normal.style").trim()
        });
        if(
            overrideStyle ||
            this.configurations.get<string>(
                "normal.style"
            ).trim().toLowerCase() === "none"
        ){
            this.indentGuideDecor = null;
        }
        this.activeGuideDecor = vscode.window.createTextEditorDecorationType({
            borderWidth: `0px 0px 0px ${
                this.getValueAsNumber("active.width")
            }px`,
            borderColor: this.configurations.get<string>("active.color"),
            borderStyle: this.configurations.get<string>("active.style").trim()
        });
        if(
            overrideStyle ||
            this.configurations.get<string>(
                "active.style"
            ).trim().toLowerCase() === "none"
        ){
            this.indentGuideDecor = null;
        }
        this.rulerGuideDecor = vscode.window.createTextEditorDecorationType({
            borderWidth: `0px 0px 0px ${
                this.getValueAsNumber("ruler.width")
            }px`,
            borderColor: this.configurations.get<string>("ruler.color"),
            borderStyle: this.configurations.get<string>("ruler.style").trim()
        });
    }

    getValueAsNumber(settingKey){
        var value = this.configurations.get<any>(settingKey);
        if(typeof(value) !== "number"){
            value = parseInt(value);
        }
        return value;
    }

    clearEditorsDecorations(){
        vscode.window.visibleTextEditors.forEach((editor) => {
            if(this.indentBackgroundDecors){
                this.indentBackgroundDecors.forEach((decoration) => {
                    editor.setDecorations(decoration, []);
                });
            }
            if(this.indentGuideDecor){
                editor.setDecorations(this.indentGuideDecor, []);
            }
            if(this.activeGuideDecor){
                editor.setDecorations(this.activeGuideDecor, []);
            }
            if(this.rulerGuideDecor){
                editor.setDecorations(this.rulerGuideDecor, []);
            }
        });
    }

    setNeedsUpdateEditor(editor: vscode.TextEditor){
        if(this.updateTimer !== null){
            return;
        }
        this.updateTimer = setTimeout(() => {
            this.updateTimer = null;
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
        if(!editor){
            return;
        }

        var indentGuideRanges: vscode.Range[] = [];
        var indentBackgrounds: any[] = [];
        var activeGuideRanges: vscode.Range[] = [];
        var rulerRanges: vscode.Range[] = [];
        var maxLevel = this.indentBackgroundDecors.length;

        var cursorPosition = editor.selection.active;
        var primaryRanges = this.getRangesForLine(
            editor, cursorPosition.line, maxLevel
        );
        var stillActive = (
            primaryRanges.activeGuideRange !== null &&
            editor.selection.isEmpty &&
            editor.selections.length == 1 &&
            this.configurations.get<boolean>(
                "active.enabled"
            )
        );
        indentGuideRanges.push(
            ...primaryRanges.indentGuideRanges
        );
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
        rulerRanges.push(
            ...primaryRanges.rulerRanges
        );

        // Search through upper ranges
        for(var line = cursorPosition.line - 1; line >= 0; line--){
            var ranges = this.getRangesForLine(
                editor, line, maxLevel, primaryRanges.activeLevel
            );
            indentGuideRanges.push(
                ...ranges.indentGuideRanges
            );
            indentBackgrounds.push(
                ...ranges.indentBackgrounds
            );
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
                stillActive = false;
            }
            rulerRanges.push(
                ...ranges.rulerRanges
            );
        }

        // Search through lower ranges
        stillActive = (
            primaryRanges.activeGuideRange !== null &&
            editor.selection.isEmpty &&
            editor.selections.length == 1 &&
            this.configurations.get<boolean>(
                "active.enabled"
            )
        );
        var totalLines = editor.document.lineCount;
        for(var line = cursorPosition.line + 1; line < totalLines; line++){
            var ranges = this.getRangesForLine(
                editor, line, maxLevel, primaryRanges.activeLevel
            );
            indentGuideRanges.push(
                ...ranges.indentGuideRanges
            );
            indentBackgrounds.push(
                ...ranges.indentBackgrounds
            );
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
                stillActive = false;
            }
            rulerRanges.push(
                ...ranges.rulerRanges
            );
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
        if(this.indentGuideDecor){
            editor.setDecorations(this.indentGuideDecor, indentGuideRanges);
        }
        if(this.activeGuideDecor){
            editor.setDecorations(this.activeGuideDecor, activeGuideRanges);
        }
        editor.setDecorations(this.rulerGuideDecor, rulerRanges);
    }

    getRangesForLine(editor: vscode.TextEditor, lineNumber: number,
                     maxLevel: number, activeLevel: number = -1){
        var activeGuideRange: vscode.Range = null;
        var indentGuideRanges: vscode.Range[] = [];
        var indentBackgrounds: any[] = [];
        var rulerRanges: vscode.Range[] = [];

        var guidelines = this.getGuides(
            editor.document.lineAt(lineNumber), editor.options.tabSize
        );
        var empty = guidelines === null;
        if(empty){
            guidelines = [];
        }
        if(activeLevel === -1){
            for (var index = guidelines.length - 1; index >= 0; index--) {
                var guide = guidelines[index];
                if(guide.type === "normal"){
                    activeLevel = index;
                    break;
                }
            }
            if(activeLevel < 0){
                activeLevel = -2;
            }
        }

        var lastPosition = new vscode.Position(lineNumber, 0);
        guidelines.forEach((guideline, level) => {
            var position = new vscode.Position(lineNumber, guideline.position);
            var inSelection = editor.selections.some((selection) => {
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
                if(guideline.type === "normal"){
                    if(level === activeLevel && (
                        !inSelection || (inSelection &&
                            !this.configurations.get<boolean>(
                                "active.hideOnSelection"
                            )
                        )
                    )){
                        activeGuideRange = new vscode.Range(position, position);
                    }else if(level !== activeLevel && (
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
            }else if(guideline.type === "ruler"){
                if(
                    !this.configurations.get<boolean>("overrideDefault") &&
                    !this.hasShowSuggestion["ruler"] &&
                    this.isEqualOrNewerVersionThan(0, 10, 10)
                ){
                    this.hasShowSuggestion["ruler"] = true;
                    vscode.window.showInformationMessage(
                        "Visual Studio Code has built-in ruler" +
                        " feature. Guides extension kindly " +
                        "suggests that you use built-in feature "+
                        "rather than using this extension."
                    );
                }
                if(
                    !inSelection || (
                        inSelection &&
                        !this.configurations.get<boolean>(
                            "ruler.hideOnSelection"
                        )
                    )
                ){
                    rulerRanges.push(new vscode.Range(position, position));
                }
            }
            lastPosition = position;
        });

        if(!empty && activeGuideRange === null){
            activeLevel = -1;
        }

        return {
            indentGuideRanges: indentGuideRanges,
            indentBackgrounds: indentBackgrounds,
            activeLevel: activeLevel,
            activeGuideRange: activeGuideRange,
            rulerRanges: rulerRanges
        };
    }

    getGuides(line: vscode.TextLine, indentSize: number){
        if(line.isEmptyOrWhitespace){
            return null;
        }
        var pattern = new RegExp(
            ` {${indentSize}}| {0,${indentSize - 1}}\t`,
            "g"
        );
        var emptySpace = " ".repeat(indentSize);
        var guides = [];
        var whitespaces = line.text.substr(
            0, line.firstNonWhitespaceCharacterIndex
        );
        var singleMatch = whitespaces.match(pattern);

        this.configurations.get<Array<number>>("rulers").forEach((stop) => {
            var sourceIndex = 0;
            var index = 0;
            if(stop < line.text.replace(pattern, emptySpace).length){
                if(singleMatch){
                    singleMatch.forEach((match) => {
                        sourceIndex += match.length;
                        index += indentSize;
                    });
                }
                guides.push({
                    type: "ruler",
                    position: sourceIndex + stop - index
                });
            }
        });

        if(!singleMatch || singleMatch.length == 0){
            return guides;
        }
        var index = 0;
        if(
            index !== line.firstNonWhitespaceCharacterIndex &&
            this.configurations.get<boolean>(
                "indent.showFirstIndentGuides"
            )
        ){
            guides.push({
                type: "normal",
                position: index
            });
        }
        for(
            var indentLevel=0;
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
        // Want to see this data?
        //   There! http://stats.digitalparticle.com/
        console.log("[Guides] Sending usage statistics...");
        if(this.startupStop === null){
            this.startupStop = Date.now();
        }
        var startupTime = (this.startupStop - this.startupTimer) / 1000.0;
        var data = querystring.stringify({
            "name": "guides",
            "schema": "0.1",
            "version": vscode.extensions.getExtension(
                "spywhere.guides"
            ).packageJSON["version"],
            "vscode_version": vscode.version,
            "platform": process.platform,
            "architecture": process.arch,
            "startup_time": startupTime.toFixed(3) + "s"
        });

        request(
            "http://api.digitalparticle.com/1/stats?" + data,
            (error, response, data) => {
                if(error){
                    this.sendStats = false;
                    console.log(
                        "[Guides] Error while sending usage statistics: " +
                        error
                    );
                }else if(response.statusCode != 200){
                    this.sendStats = false;
                    console.log(
                        "[Guides] Error while sending usage statistics: " +
                        "ErrorCode " + response.statusCode
                    );
                }else if(data.toLowerCase() !== "finished"){
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
            }
        );
    }

    isEqualOrNewerVersionThan(major: number, minor: number, patch: number){
        var targetVersions = [major, minor, patch];
        var currentVersions = vscode.version.match(
            "\\d+\\.\\d+\\.\\d+"
        )[0].split(".").map((value)=>{
            return parseInt(value);
        });
        for (var index = 0; index < targetVersions.length; index++) {
            var targetVersion = targetVersions[index];
            var currentVersion = currentVersions[index];
            if(currentVersion < targetVersion){
                return false;
            }
        }
        return true;
    }
}
