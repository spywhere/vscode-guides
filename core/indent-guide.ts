import * as _ from "lazy.js";
import EditorContext from "./editor-context";

export interface IndentGuide {
    type: "start" | "normal" | "end";
    position: number;
    indentLevel: number;
}

export function getGuides(
    context: EditorContext,
    text: string,
    predeterminations?: Partial<{
        isEmptyOrWhitespace: boolean;
        firstNonWhitespaceCharacterIndex: number;
    }>
) {
    if (
        (
            !predeterminations && text === ""
        ) ||
        (
            predeterminations && predeterminations.isEmptyOrWhitespace
        )
    ) {
        return undefined;
    }

    let tabSize = context.tabSize;

    let pattern = new RegExp(` {${ tabSize }}| {0,${ tabSize - 1 }}\t`, "g");

    let guides: IndentGuide[] = [];

    let firstNonWhitespaceCharacterIndex = (
        predeterminations &&
        predeterminations.firstNonWhitespaceCharacterIndex !== undefined
    ) ? predeterminations.firstNonWhitespaceCharacterIndex : (
        ((
            _(text).split("").map(
                (subtext) => subtext.trim() !== ""
            ).indexOf(true)
        ) as any) as number
    );

    if (firstNonWhitespaceCharacterIndex < 0) {
        firstNonWhitespaceCharacterIndex = text.length;
    }

    let whitespaces = text.substr(0, firstNonWhitespaceCharacterIndex);
    let singleMatch = whitespaces.match(pattern);

    if (!singleMatch || singleMatch.length === 0) {
        return guides;
    }

    guides.push({
        type: "start",
        position: 0,
        indentLevel: 0
    });

    let index = 0;
    for (
        let indentLevel = 0;
        indentLevel < singleMatch.length;
        indentLevel++
    ) {
        index += singleMatch[indentLevel].length;
        guides.push({
            type: (
                index === firstNonWhitespaceCharacterIndex
            ) ? "end" : "normal",
            position: index,
            indentLevel: indentLevel + 1
        });
    }
    return guides;
}
