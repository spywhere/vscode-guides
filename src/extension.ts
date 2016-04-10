import * as vscode from 'vscode';

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
        vscode.workspace.onDidChangeConfiguration(
            this.updateEditors, this, subscriptions
        );

        this.disposable = vscode.Disposable.from(...subscriptions);
    }

    dispose(){
        this.disposable.dispose();
    }

    private updateSelection(event: vscode.TextEditorSelectionChangeEvent){
        if(event.selections.some((selection) => {
            return !selection.isEmpty;
        })){
            this.guides.setNeedsUpdateEditor(event.textEditor);
        }
    }

    private updateActiveEditor(editor: vscode.TextEditor){
        this.guides.setNeedsUpdateEditor(editor);
    }

    private updateEditors(){
        this.guides.reset();
    }
}

class Guides {
    private normalGuideDecor: vscode.TextEditorDecorationType;
    private rulerGuideDecor: vscode.TextEditorDecorationType;
    private normalGuideBackgroundDecors: Array<vscode.TextEditorDecorationType>;

    private hasShowSuggestion: boolean = false;
    private configurations: vscode.WorkspaceConfiguration;

    private timerDelay: number = 0.1;
    private updateTimer: number = null;

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
        if(this.normalGuideDecor){
            this.normalGuideDecor.dispose();
        }
        if(this.rulerGuideDecor){
            this.rulerGuideDecor.dispose();
        }
    }

    loadSettings(){
        this.configurations = vscode.workspace.getConfiguration("guides");

        this.normalGuideBackgroundDecors = [];
        this.configurations.get<any>(
            "normal.backgrounds"
        ).forEach((backgroundColor) => {
            this.normalGuideBackgroundDecors.push(
                vscode.window.createTextEditorDecorationType({
                    backgroundColor: backgroundColor
                })
            );
        });
        this.normalGuideDecor = vscode.window.createTextEditorDecorationType({
            outlineWidth: this.configurations.get<string>("normal.width"),
            outlineColor: this.configurations.get<string>("normal.color"),
            outlineStyle: this.configurations.get<string>("normal.style")
        });
        this.rulerGuideDecor = vscode.window.createTextEditorDecorationType({
            outlineWidth: this.configurations.get<string>("ruler.width"),
            outlineColor: this.configurations.get<string>("ruler.color"),
            outlineStyle: this.configurations.get<string>("ruler.style")
        });
    }

    clearEditorsDecorations(){
        vscode.window.visibleTextEditors.forEach((editor) => {
            if(this.normalGuideBackgroundDecors){
                this.normalGuideBackgroundDecors.forEach((decoration) => {
                    editor.setDecorations(decoration, []);
                });
            }
            if(this.normalGuideDecor){
                editor.setDecorations(this.normalGuideDecor, []);
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
        // If no editor set, do nothing
        //   This can occur when active editor is not set
        if(!editor){
            return;
        }

        // Store the array and manipulate the array instead
        //   To increase the performances
        var normalRanges: vscode.Range[] = [];
        var normalBackgrounds: any[] = [];
        var rulerRanges: vscode.Range[] = [];
        var maxLevel = this.normalGuideBackgroundDecors.length;
        for(var line=0; line < editor.document.lineCount; line++){
            var guidelines = this.getGuides(
                editor.document.lineAt(line), editor.options.tabSize
            );
            var lastPosition = new vscode.Position(line, 0);
            guidelines.forEach((guideline, level) => {
                var position = new vscode.Position(line, guideline.position);
                var inSelection = false;
                editor.selections.forEach((selection) => {
                    if(selection.contains(position)){
                        inSelection = true;
                        return;
                    }
                });
                if(guideline.type === "normal" || guideline.type === "extra"){
                    // Add background color stop points if there are colors
                    if(maxLevel > 0){
                        normalBackgrounds.push({
                            level: level,
                            range: new vscode.Range(
                                lastPosition, position
                            )
                        });
                    }
                    if(
                        guideline.type === "normal" &&
                        (!inSelection || (
                            inSelection &&
                            !this.configurations.get<boolean>("normal.hideOnSelection")
                        ))
                    ){
                        normalRanges.push(new vscode.Range(position, position));
                    }
                }else if(guideline.type === "ruler"){
                    if(
                        !this.configurations.get<boolean>("overrideDefault") &&
                        !this.hasShowSuggestion &&
                        this.isEqualOrNewerVersionThan(0, 10, 10)
                    ){
                        this.hasShowSuggestion = true;
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
                            !this.configurations.get<boolean>("ruler.hideOnSelection")
                        )
                    ){
                        rulerRanges.push(new vscode.Range(position, position));
                    }
                }
                lastPosition = position;
            });
        }
        this.normalGuideBackgroundDecors.forEach((decoration, level) => {
            editor.setDecorations(decoration, normalBackgrounds.filter(
                (stopPoint) => {
                    return (
                        stopPoint.level % maxLevel === level
                    );
                }
            ).map((stopPoint) => {
                return stopPoint.range;
            }));
        });
        editor.setDecorations(this.normalGuideDecor, normalRanges.filter(
            (range) => {
                return range !== null;
            }
        ));
        editor.setDecorations(this.rulerGuideDecor, rulerRanges.filter(
            (range) => {
                return range !== null;
            }
        ));
    }

    getGuides(line: vscode.TextLine, indentSize: number){
        if(line.isEmptyOrWhitespace){
            return [];
        }
        var pattern = new RegExp(
            ` {${indentSize}}| {0,${indentSize - 1}}\t`,
            "g"
        );
        var emptySpace = "";
        for(var i=0; i < indentSize; i++){
            emptySpace += " ";
        }
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
                        index += 4;
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
        for(
            var indentLevel=0;
            indentLevel < singleMatch.length;
            indentLevel++
        ){
            index += singleMatch[indentLevel].length;
            guides.push({
                type: (
                    indentLevel < singleMatch.length - 1
                ) ? "normal" : "extra",
                position: index
            });
        }
        return guides;
    }

    isEqualOrNewerVersionThan(major: number, minor: number, patch: number){
        var targetVersions = [major, minor, patch];
        var currentVersions = vscode.version.split(".").map((value)=>{
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
