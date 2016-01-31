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
            this.updateEditor, this, subscriptions
        );
        vscode.window.onDidChangeActiveTextEditor(
            this.updateEditor, this, subscriptions
        );
        vscode.workspace.onDidChangeConfiguration(
            this.updateEditors, this, subscriptions
        );

        this.disposable = vscode.Disposable.from(...subscriptions);
    }

    dispose(){
        this.disposable.dispose();
    }

    private updateEditor(){
        this.guides.updateEditor(vscode.window.activeTextEditor);
    }

    private updateEditors(){
        this.guides.reset();
    }
}

class Guides {
    public normalGuideDecoration: vscode.TextEditorDecorationType;
    public rulerGuideDecoration: vscode.TextEditorDecorationType;

    private configurations: any;

    reset(){
        this.dispose();
        this.loadSettings();
        this.updateEditors();
    }

    dispose(){
        if(this.normalGuideDecoration){
            this.normalGuideDecoration.dispose();
        }
        if(this.rulerGuideDecoration){
            this.rulerGuideDecoration.dispose();
        }
    }

    loadSettings(){
        this.configurations = vscode.workspace.getConfiguration("guides");

        this.normalGuideDecoration = vscode.window.createTextEditorDecorationType({
            outlineWidth: this.configurations.normal.width,
            outlineColor: this.configurations.normal.color,
            outlineStyle: this.configurations.normal.style
        });
        this.rulerGuideDecoration = vscode.window.createTextEditorDecorationType({
            outlineWidth: this.configurations.ruler.width,
            outlineColor: this.configurations.ruler.color,
            outlineStyle: this.configurations.ruler.style
        });
    }

    updateEditors(){
        vscode.window.visibleTextEditors.forEach((editor) => {
            this.updateEditor(editor);
        });
    }

    updateEditor(editor: vscode.TextEditor){
        // Store the array and manipulate the array instead
        // To increate the performances
        var normalRanges: vscode.Range[] = [];
        var rulerRanges: vscode.Range[] = [];
        for(var line=0; line < editor.document.lineCount; line++){
            var guidelines = this.getGuides(
                editor.document.lineAt(line), editor.options.tabSize
            );
            guidelines.forEach((guideline) => {
                var position = new vscode.Position(line, guideline.position);
                var inSelection = false;
                editor.selections.forEach((selection) => {
                    if(selection.contains(position)){
                        inSelection = true;
                        return;
                    }
                });
                if(guideline.type === "normal"){
                    if(!inSelection || (inSelection && !this.configurations.normal.hideOnSelection)){
                        normalRanges.push(new vscode.Range(position, position));
                    }else{
                        normalRanges.push(null);
                    }
                }else{
                    if(!inSelection || (inSelection && !this.configurations.ruler.hideOnSelection)){
                        rulerRanges.push(new vscode.Range(position, position));
                    }else{
                        normalRanges.push(null);
                    }
                }
            });
        }
        editor.setDecorations(this.normalGuideDecoration, normalRanges.filter(
            (range) => {
                return range !== null;
            }
        ));
        editor.setDecorations(this.rulerGuideDecoration, rulerRanges.filter(
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

        this.configurations.rulers.forEach((stop) => {
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
            indentLevel < singleMatch.length - 1;
            indentLevel++
        ){
            index += singleMatch[indentLevel].length;
            guides.push({
                type: "normal",
                position: index
            });
        }
        return guides;
    }
}
