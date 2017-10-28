import Configurations from "../../core/implementations/mock-configurations";
import IndentContext from "../../core/indent-context";
import * as IndentGuide from "../../core/indent-guide";
import * as IndentRange from "../../core/indent-range";

describe("indent-range", () => {
    it("should find rendering ranges when cursor on a whitespace", () => {
        let lineText = "  \t  abcdef";

        let context: IndentContext = {
            tabSize: 2,
            configurations: Configurations({
                indent: {
                    firstIndent: true
                },
                active: {
                    extraIndent: false
                }
            }),
            activeGuides: {
                level: -1,
                cursorPositionInLine: 3
            }
        };

        let guides = IndentGuide.getGuides(context, lineText) || [];

        let extraContext: IndentContext = {
            tabSize: 2,
            configurations: Configurations({
                indent: {
                    firstIndent: false
                },
                active: {
                    extraIndent: true
                }
            }),
            activeGuides: {
                level: -1,
                cursorPositionInLine: 4
            }
        };

        let extraGuides = IndentGuide.getGuides(extraContext, lineText) || [];

        expect(
            IndentRange.getRangesForIndentGuides(context, lineText, guides)
        ).toMatchObject({
            guides: {
                stack: [0],
                active: {
                    position: 2
                },
                normal: [3]
            },
            backgrounds: [{
                from: 0,
                to: 2
            }, {
                from: 2,
                to: 3
            }, {
                from: 3,
                to: 5
            }]
        });

        expect(IndentRange.getRangesForIndentGuides(
            extraContext, lineText, extraGuides
        )).toMatchObject({
            guides: {
                stack: [2],
                active: {
                    position: 3
                },
                normal: [5]
            },
            backgrounds: [{
                from: 0,
                to: 2
            }, {
                from: 2,
                to: 3
            }, {
                from: 3,
                to: 5
            }]
        });
    });

    it("should find rendering ranges when cursor on a text in a line", () => {
        let lineText = "  \t  abcdef";

        let context: IndentContext = {
            tabSize: 2,
            configurations: Configurations({
                indent: {
                    firstIndent: true
                },
                active: {
                    extraIndent: false
                }
            }),
            activeGuides: {
                level: -1,
                cursorPositionInLine: 8
            }
        };

        let guides = IndentGuide.getGuides(context, lineText) || [];

        let extraContext: IndentContext = {
            tabSize: 2,
            configurations: Configurations({
                indent: {
                    firstIndent: false
                },
                active: {
                    extraIndent: true
                }
            }),
            activeGuides: {
                level: -1,
                cursorPositionInLine: 8
            }
        };

        let extraGuides = IndentGuide.getGuides(extraContext, lineText) || [];

        expect(
            IndentRange.getRangesForIndentGuides(context, lineText, guides)
        ).toMatchObject({
            guides: {
                stack: [0, 2],
                active: {
                    position: 3
                },
                normal: []
            },
            backgrounds: [{
                from: 0,
                to: 2
            }, {
                from: 2,
                to: 3
            }, {
                from: 3,
                to: 5
            }]
        });

        expect(IndentRange.getRangesForIndentGuides(
            extraContext, lineText, extraGuides
        )).toMatchObject({
            guides: {
                stack: [2, 3],
                active: {
                    position: 5
                },
                normal: []
            },
            backgrounds: [{
                from: 0,
                to: 2
            }, {
                from: 2,
                to: 3
            }, {
                from: 3,
                to: 5
            }]
        });
    });

    it("should find rendering ranges when cursor is at the end of line", () => {
        let lineText = "  \t  abcdef";

        let context: IndentContext = {
            tabSize: 2,
            configurations: Configurations({
                indent: {
                    firstIndent: true
                },
                active: {
                    extraIndent: false
                }
            }),
            activeGuides: {
                level: -1,
                cursorPositionInLine: 11
            }
        };

        let guides = IndentGuide.getGuides(context, lineText) || [];

        let extraContext: IndentContext = {
            tabSize: 2,
            configurations: Configurations({
                indent: {
                    firstIndent: false
                },
                active: {
                    extraIndent: true
                }
            }),
            activeGuides: {
                level: -1,
                cursorPositionInLine: 11
            }
        };

        let extraGuides = IndentGuide.getGuides(extraContext, lineText) || [];

        expect(
            IndentRange.getRangesForIndentGuides(context, lineText, guides)
        ).toMatchObject({
            guides: {
                stack: [0, 2],
                active: {
                    position: 3
                },
                normal: []
            },
            backgrounds: [{
                from: 0,
                to: 2
            }, {
                from: 2,
                to: 3
            }, {
                from: 3,
                to: 5
            }]
        });

        expect(IndentRange.getRangesForIndentGuides(
            extraContext, lineText, extraGuides
        )).toMatchObject({
            guides: {
                stack: [2, 3],
                active: {
                    position: 5
                },
                normal: []
            },
            backgrounds: [{
                from: 0,
                to: 2
            }, {
                from: 2,
                to: 3
            }, {
                from: 3,
                to: 5
            }]
        });
    });
});
