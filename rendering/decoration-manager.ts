import * as vscode from "vscode";

class DecorationManager {
    protected decorations: {
        [key: string]: vscode.TextEditorDecorationType;
    } = {};

    clearDecorations(textEditor?: vscode.TextEditor){
        for (let key of Object.keys(this.decorations)) {
            let decoration = this.decorations[key];
            if (textEditor) {
                textEditor.setDecorations(decoration, []);
            }
            decoration.dispose();
        }
        this.decorations = {};
    }

    decorationName(option: vscode.DecorationRenderOptions){
        return JSON.stringify(option);
    }

    getDecoration(option: vscode.DecorationRenderOptions){
        let key = this.decorationName(option);
        if (this.decorations[key]) {
            return this.decorations[key];
        }

        this.decorations[key] = vscode.window.createTextEditorDecorationType(
            option
        );

        return this.decorations[key];
    }
}

export default DecorationManager;
