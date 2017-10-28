import * as vscode from "vscode";
import GuidesDelegate from "../protocols/guides-delegate";

export class GuidesController implements GuidesDelegate {

    // MARK: Life Cycle

    onDidLoad() {

    }

    // MARK: GuidesControllerDelegate

    onTextSelectionDidChange(
        event: vscode.TextEditorSelectionChangeEvent
    ) {

    }

    onActiveEditorDidChange(editor: vscode.TextEditor) {

    }

    onEditorSettingsDidChange(event: vscode.TextEditorOptionsChangeEvent) {
        // Update editor context (tab size)
    }

    onConfigurationsDidChange() {
        // Reset all guides
        // Recreate decorations
        // Update all editors
    }

    // MARK:
}

export default GuidesController;
