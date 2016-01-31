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
            this.onEvent, this, subscriptions
        );
        vscode.window.onDidChangeActiveTextEditor(
            this.onEvent, this, subscriptions
        );

        this.disposable = vscode.Disposable.from(...subscriptions);
    }

    dispose(){
        this.disposable.dispose();
    }

    private onEvent(){
        this.guides.updateEditor(vscode.window.activeTextEditor);
    }
}

class Guides {
    public normalGuideDecoration: vscode.TextEditorDecorationType;
    public rulerGuideDecoration: vscode.TextEditorDecorationType;

    private rulerStops: number[] = [];

    reset(){
        this.dispose();
        this.createGuides();
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

    createGuides(){
        var configurations:any = vscode.workspace.getConfiguration("guides");

        this.normalGuideDecoration = vscode.window.createTextEditorDecorationType({
            outlineWidth: configurations.normal.width,
            outlineColor: configurations.normal.color,
            outlineStyle: configurations.normal.style
        });
        this.rulerGuideDecoration = vscode.window.createTextEditorDecorationType({
            outlineWidth: configurations.ruler.width,
            outlineColor: configurations.ruler.color,
            outlineStyle: configurations.ruler.style
        });

        this.rulerStops = configurations.rulers;
    }

    updateEditors(){
        vscode.window.visibleTextEditors.forEach((editor) => {
            this.updateEditor(editor);
        });
    }

    updateEditor(editor: vscode.TextEditor){
        var normalRanges: vscode.Range[] = [];
        var rulerRanges: vscode.Range[] = [];
        for(var line=0; line < editor.document.lineCount; line++){
            var guidelines = this.getGuides(
                editor.document.lineAt(line), editor.options.tabSize
            );
            guidelines.forEach((guideline) => {
                var position = new vscode.Position(line, guideline.position);
                if(guideline.type === "normal"){
                    normalRanges.push(new vscode.Range(position, position));
                }else{
                    rulerRanges.push(new vscode.Range(position, position));
                }
            });
        }
        editor.setDecorations(this.normalGuideDecoration, normalRanges);
        editor.setDecorations(this.rulerGuideDecoration, rulerRanges);
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

        this.rulerStops.forEach((stop) => {
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
