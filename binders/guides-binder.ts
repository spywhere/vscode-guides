import * as vscode from "vscode";
import BaseBinder from "./base-binder";
import GuidesDelegate from "../protocols/guides-delegate";

export class GuidesBinder extends BaseBinder<GuidesDelegate> {
    constructor() {
        super();
        let subscriptions: vscode.Disposable[] = [];

        vscode.window.onDidChangeTextEditorSelection(
            this.onDidChangeTextEditorSelection.bind(this), this, subscriptions
        );
        vscode.window.onDidChangeActiveTextEditor(
            this.onDidChangeActiveTextEditor.bind(this), this, subscriptions
        );
        vscode.window.onDidChangeTextEditorOptions(
            this.onDidChangeTextEditorOptions.bind(this), this, subscriptions
        );
        vscode.workspace.onDidChangeConfiguration(
            this.onDidChangeConfiguration.bind(this), this, subscriptions
        );

        this.disposable = vscode.Disposable.from(...subscriptions);
    }

    protected onDidChangeTextEditorSelection(
        event: vscode.TextEditorSelectionChangeEvent
    ) {
        this.handlers.forEach((handler) => {
            /* tslint:disable-next-line:no-unbound-method */
            if (!handler.onTextSelectionDidChange) {
                return;
            }
            handler.onTextSelectionDidChange(event);
        });
    }

    protected onDidChangeActiveTextEditor(editor: vscode.TextEditor) {
        this.handlers.forEach((handler) => {
            /* tslint:disable-next-line:no-unbound-method */
            if (!handler.onActiveEditorDidChange) {
                return;
            }
            handler.onActiveEditorDidChange(editor);
        });
    }

    protected onDidChangeTextEditorOptions(
        event: vscode.TextEditorOptionsChangeEvent
    ) {
        this.handlers.forEach((handler) => {
            /* tslint:disable-next-line:no-unbound-method */
            if (!handler.onEditorSettingsDidChange) {
                return;
            }
            handler.onEditorSettingsDidChange(event);
        });
    }

    protected onDidChangeConfiguration() {
        this.handlers.forEach((handler) => {
            /* tslint:disable-next-line:no-unbound-method */
            if (!handler.onConfigurationsDidChange) {
                return;
            }
            handler.onConfigurationsDidChange();
        });
    }
}

export default GuidesBinder;
