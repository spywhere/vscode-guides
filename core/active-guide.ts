import EditorContext from "./editor-context";
import { IndentGuide } from "./indent-guide";

export function findActiveGuideIndex(
    guides: IndentGuide[],
    editorContext: EditorContext,
    predeterminations: {
        cursorPositionInLine?: number;
        lineText: string;
    },
    activeGuideContext?: IndentGuide
): number {
    if (activeGuideContext && activeGuideContext.indentLevel >= 0) {
        return guides.findIndex(
            (guide) => guide.indentLevel === activeGuideContext.indentLevel
        );
    }

    let extraIndent = editorContext.configurations.get(
        "active.extraIndent", false
    );
    let expandBrackets = editorContext.configurations.get(
        "active.expandBrackets", false
    );

    let cursorPosition = (
        predeterminations.cursorPositionInLine === undefined ?
        predeterminations.lineText.length :
        predeterminations.cursorPositionInLine
    );

    if (expandBrackets) {
        let lastCharacter = (
            cursorPosition > 0 &&
            cursorPosition <= predeterminations.lineText.length
        ) ? predeterminations.lineText[cursorPosition - 1] : "";

        if (
            lastCharacter &&
            "[({})]".indexOf(lastCharacter) >= 0
        ) {
            cursorPosition -= 1;
        }
    }

    for (let index = guides.length - 1; index >= 0; index--) {
        let indentGuide = guides[index];

        if (
            (extraIndent && indentGuide.position <= cursorPosition) ||
            (!extraIndent && indentGuide.type !== "end" && (
                indentGuide.position < cursorPosition
            ))
        ) {
            return index;
        }
    }
    return -1;
}
