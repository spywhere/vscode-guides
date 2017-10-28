import Configurations from "../../core/implementations/mock-configurations";
import IndentContext from "../../core/indent-context";
import * as IndentGuide from "../../core/indent-guide";
import * as ActiveGuide from "../../core/active-guide";

describe("active-guide", () => {
    it("should find an active position without an extra indent option", () => {
        let lineText = "  \t  }";

        let beforeContext: IndentContext = {
            tabSize: 2,
            configurations: Configurations({
                active: {
                    extraIndent: false,
                    expandBrackets: false
                }
            }),
            activeGuides: {
                level: -1,
                cursorPositionInLine: 5
            }
        };

        let beforeGuides = IndentGuide.getGuides(beforeContext, lineText);

        let afterContext: IndentContext = {
            tabSize: 2,
            configurations: Configurations({
                active: {
                    extraIndent: false,
                    expandBrackets: true
                }
            }),
            activeGuides: {
                level: -1,
                cursorPositionInLine: 6
            }
        };

        let afterGuides = IndentGuide.getGuides(afterContext, lineText);

        expect(ActiveGuide.findActivePosition(
            beforeContext, lineText, beforeGuides
        )).toMatchObject({
            position: 3
        });

        expect(ActiveGuide.findActivePosition(
            afterContext, lineText, afterGuides
        )).toMatchObject({
            position: 3
        });
    });

    it("should find an active position with an extra indent option", () => {
        let lineText = "  \t  }";

        let beforeContext: IndentContext = {
            tabSize: 2,
            configurations: Configurations({
                active: {
                    extraIndent: true,
                    expandBrackets: false
                }
            }),
            activeGuides: {
                level: -1,
                cursorPositionInLine: 5
            }
        };

        let beforeGuides = IndentGuide.getGuides(beforeContext, lineText);

        let afterContext: IndentContext = {
            tabSize: 2,
            configurations: Configurations({
                active: {
                    extraIndent: true,
                    expandBrackets: true
                }
            }),
            activeGuides: {
                level: -1,
                cursorPositionInLine: 6
            }
        };

        let afterGuides = IndentGuide.getGuides(afterContext, lineText);

        expect(ActiveGuide.findActivePosition(
            beforeContext, lineText, beforeGuides
        )).toMatchObject({
            position: 5
        });

        expect(ActiveGuide.findActivePosition(
            afterContext, lineText, afterGuides
        )).toMatchObject({
            position: 5
        });
    });
});
