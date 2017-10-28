import * as vscode from "vscode";
import GuidesDelegate from "../protocols/guides-delegate";

export class GuidesController implements GuidesDelegate {

    // MARK: Life Cycle

    onDidLoad() {
        // TODO: Implement this
    }

    // MARK: GuidesControllerDelegate

    onTextSelectionDidChange(
        event: vscode.TextEditorSelectionChangeEvent
    ) {
        // TODO: Implement this
    }

    onActiveEditorDidChange(editor: vscode.TextEditor) {
        // TODO: Implement this
    }

    onEditorSettingsDidChange(event: vscode.TextEditorOptionsChangeEvent) {
        // TODO: Implement this
        // Update editor context (tab size)
    }

    onConfigurationsDidChange() {
        // TODO: Implement this
        // Reset all guides
        // Recreate decorations
        // Update all editors
    }

    // MARK:
}

export default GuidesController;
