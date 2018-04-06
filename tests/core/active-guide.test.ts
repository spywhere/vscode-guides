import Configurations from "../../core/implementations/mock-configurations";
import EditorContext from "../../core/editor-context";
import * as IndentGuide from "../../core/indent-guide";
import * as ActiveGuide from "../../core/active-guide";

describe("active-guide", () => {
    it("should find an active position without an extra indent option", () => {
        let lineText = "  \t  }";

        let beforeContext: EditorContext = {
            tabSize: 2,
            configurations: Configurations({
                active: {
                    extraIndent: false,
                    expandBrackets: false
                }
            })
        };

        let beforeGuides = IndentGuide.getGuides(
            beforeContext, lineText
        ) || [];

        let afterContext: EditorContext = {
            tabSize: 2,
            configurations: Configurations({
                active: {
                    extraIndent: false,
                    expandBrackets: true
                }
            })
        };

        let afterGuides = IndentGuide.getGuides(afterContext, lineText) || [];

        expect(ActiveGuide.findActiveGuideIndex(beforeGuides, beforeContext, {
            cursorPositionInLine: 5,
            lineText
        })).toBe(2);

        expect(ActiveGuide.findActiveGuideIndex(afterGuides, afterContext, {
            cursorPositionInLine: 6,
            lineText
        })).toBe(2);
    });

    it("should find an active position with an extra indent option", () => {
        let lineText = "  \t  }";

        let beforeContext: EditorContext = {
            tabSize: 2,
            configurations: Configurations({
                active: {
                    extraIndent: true,
                    expandBrackets: false
                }
            })
        };

        let beforeGuides = IndentGuide.getGuides(
            beforeContext, lineText
        ) || [];

        let afterContext: EditorContext = {
            tabSize: 2,
            configurations: Configurations({
                active: {
                    extraIndent: true,
                    expandBrackets: true
                }
            })
        };

        let afterGuides = IndentGuide.getGuides(afterContext, lineText) || [];

        expect(ActiveGuide.findActiveGuideIndex(beforeGuides, beforeContext, {
            cursorPositionInLine: 5,
            lineText
        })).toBe(3);

        expect(ActiveGuide.findActiveGuideIndex(afterGuides, afterContext, {
            cursorPositionInLine: 6,
            lineText
        })).toBe(3);
    });
});
