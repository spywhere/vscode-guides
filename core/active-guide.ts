import IndentContext from "./indent-context";
import { IndentGuide } from "./indent-guide";

export interface ActiveGuide extends IndentGuide {
    shouldFind?: {
        upper: boolean;
        lower: boolean;
    };
}

export function findActivePosition(
    context: IndentContext,
    lineText: string,
    guides: IndentGuide[]
): ActiveGuide | undefined {
    if (!context.activeGuides) {
        return undefined;
    } else if (
        context.activeGuides.level >= 0
    ) {
        return (
            context.activeGuides.level < guides.length ?
            guides[context.activeGuides.level] : undefined
        );
    }

    let extraIndent = context.configurations.get(
        "active.extraIndent", false
    );
    let expandBrackets = context.configurations.get(
        "active.expandBrackets", false
    );

    let cursorPosition = context.activeGuides.cursorPositionInLine;

    if (expandBrackets) {
        let lastCharacter = (
            cursorPosition <= lineText.length ?
            lineText[cursorPosition - 1] : ""
        );

        if (
            lastCharacter &&
            "[({})]".split("").some((character) => lastCharacter === character)
        ) {
            cursorPosition -= 1;
        }
    }

    for (let index = guides.length - 1; index >= 0; index--) {
        let indentGuide = guides[index];

        if (
            (extraIndent && (
                indentGuide.position <=
                cursorPosition
            )) || (!extraIndent && indentGuide.type !== "end" && (
                indentGuide.position <
                context.activeGuides.cursorPositionInLine
            ))
        ) {
            return indentGuide;
        }
    }
    return undefined;
}
