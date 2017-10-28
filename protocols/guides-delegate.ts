import * as vscode from "vscode";
import BaseDelegate from "./base-delegate";

export interface GuidesDelegate extends BaseDelegate {
    onTextSelectionDidChange?(
        event: vscode.TextEditorSelectionChangeEvent
    ): void;
    onActiveEditorDidChange?(editor: vscode.TextEditor): void;
    onEditorSettingsDidChange?(
        event: vscode.TextEditorOptionsChangeEvent
    ): void;
    onConfigurationsDidChange?(): void;
}

export default GuidesDelegate;
