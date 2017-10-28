import IndentContext from "./indent-context";

export interface IndentGuide {
    type: "start" | "normal" | "end";
    position: number;
    indentLevel: number;
}

export function getGuides(
    context: IndentContext,
    text: string,
    option?: Partial<{
        isEmptyOrWhitespace: boolean;
        firstNonWhitespaceCharacterIndex: number;
    }>
) {
    if (
        (
            !option && text === ""
        ) ||
        (
            option && option.isEmptyOrWhitespace
        )
    ) {
        return undefined;
    }

    let tabSize = context.tabSize;

    let pattern = new RegExp(` {${ tabSize }}| {0,${ tabSize - 1 }}\t`, "g");
    let emptySpace = " ".repeat(tabSize);

    let guides: IndentGuide[] = [];

    let firstNonWhitespaceCharacterIndex = (
        option && option.firstNonWhitespaceCharacterIndex !== undefined
    ) ? option.firstNonWhitespaceCharacterIndex : (
        text.split("").findIndex((subtext) => subtext.trim() !== "")
    );

    if (firstNonWhitespaceCharacterIndex < 0) {
        firstNonWhitespaceCharacterIndex = text.length;
    }

    let whitespaces = text.substr(0, firstNonWhitespaceCharacterIndex);
    let singleMatch = whitespaces.match(pattern);

    if (!singleMatch || singleMatch.length == 0) {
        return guides;
    }

    guides.push({
        type: "start",
        position: 0,
        indentLevel: 0
    });

    let index = 0;
    for(
        let indentLevel = 0;
        indentLevel < singleMatch.length;
        indentLevel++
    ){
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
