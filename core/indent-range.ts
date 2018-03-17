import EditorContext from "./editor-context";
import { IndentGuide } from "./indent-guide";

export interface GuideRanges {
    guides: {
        stack: number[];
        active?: number;
        normal: number[];
    };
    backgrounds: {
        from: number;
        to: number;
    }[];
}

export function getRangesForIndentGuides(
    context: EditorContext,
    guides: IndentGuide[],
    activeGuide?: IndentGuide
): GuideRanges {
    let stack: number[] = [];
    let normal: number[] = [];
    let backgrounds: {
        from: number;
        to: number;
    }[] = [];

    let firstIndent = context.configurations.get(
        "indent.firstIndent", true
    );
    let extraIndent = context.configurations.get(
        "active.extraIndent", false
    );

    for (let index = 0; index < guides.length; index++) {
        let indentGuide = guides[index];

        if (index > 0) {
            backgrounds.push({
                from: guides[index - 1].position,
                to: indentGuide.position
            });
        }

        if (
            (!extraIndent && indentGuide.type === "end") ||
            (!firstIndent && indentGuide.type === "start")
        ) {
            continue;
        }

        if (
            activeGuide === undefined ||
            indentGuide.position > activeGuide.position
        ) {
            normal.push(indentGuide.position);
        } else if (indentGuide.position < activeGuide.position) {
            stack.push(indentGuide.position);
        }
    }

    return {
        guides: {
            stack,
            active: activeGuide ? activeGuide.position : undefined,
            normal
        },
        backgrounds
    };
}
