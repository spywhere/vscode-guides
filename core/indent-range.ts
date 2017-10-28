import IndentContext from "./indent-context";
import { IndentGuide } from "./indent-guide";
import { ActiveGuide, findActivePosition } from "./active-guide";

export interface GuideRanges {
    guides: {
        stack: number[];
        active?: ActiveGuide;
        normal: number[];
    };
    backgrounds: {
        from: number;
        to: number;
    }[];
}

export function getRangesForIndentGuides(
    context: IndentContext,
    lineText: string,
    guides: IndentGuide[]
): GuideRanges {
    guides = guides || [];

    let stack: number[] = [];
    let normal: number[] = [];
    let backgrounds: {
        from: number;
        to: number;
    }[] = [];

    let active = findActivePosition(context, lineText, guides);
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

        if (active === undefined || indentGuide.position > active.position) {
            normal.push(indentGuide.position);
        } else if (indentGuide.position < active.position) {
            stack.push(indentGuide.position);
        }
    }

    return {
        guides: {
            stack,
            active,
            normal
        },
        backgrounds
    };
}
