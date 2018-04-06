import Configurations from "../../core/implementations/mock-configurations";
import EditorContext from "../../core/editor-context";
import * as IndentGuide from "../../core/indent-guide";
import * as ActiveGuide from "../../core/active-guide";
import * as IndentRange from "../../core/indent-range";

describe("indent-range", () => {
    it("should find rendering ranges when cursor on a whitespace", () => {
        let lineText = "  \t  abcdef";

        let context: EditorContext = {
            tabSize: 2,
            configurations: Configurations({
                indent: {
                    firstIndent: true
                },
                active: {
                    extraIndent: false
                }
            })
        };

        let guides = IndentGuide.getGuides(context, lineText) || [];
        let activeIndex = ActiveGuide.findActiveGuideIndex(
            guides, context, {
                cursorPositionInLine: 3,
                lineText
            }
        );

        let extraContext: EditorContext = {
            tabSize: 2,
            configurations: Configurations({
                indent: {
                    firstIndent: false
                },
                active: {
                    extraIndent: true
                }
            })
        };

        let extraGuides = IndentGuide.getGuides(extraContext, lineText) || [];
        let extraActiveIndex = ActiveGuide.findActiveGuideIndex(
            extraGuides, extraContext, {
                cursorPositionInLine: 4,
                lineText
            }
        );

        expect(IndentRange.getRangesForIndentGuides(
            context, guides,
            activeIndex < 0 ? undefined : guides[activeIndex]
        )).toMatchObject({
            guides: {
                stack: [0],
                active: 2,
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
            extraContext, extraGuides,
            extraActiveIndex < 0 ? undefined : extraGuides[extraActiveIndex]
        )).toMatchObject({
            guides: {
                stack: [2],
                active: 3,
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

        let context: EditorContext = {
            tabSize: 2,
            configurations: Configurations({
                indent: {
                    firstIndent: true
                },
                active: {
                    extraIndent: false
                }
            })
        };

        let guides = IndentGuide.getGuides(context, lineText) || [];
        let activeIndex = ActiveGuide.findActiveGuideIndex(
            guides, context, {
                cursorPositionInLine: 8,
                lineText
            }
        );

        let extraContext: EditorContext = {
            tabSize: 2,
            configurations: Configurations({
                indent: {
                    firstIndent: false
                },
                active: {
                    extraIndent: true
                }
            })
        };

        let extraGuides = IndentGuide.getGuides(extraContext, lineText) || [];
        let extraActiveIndex = ActiveGuide.findActiveGuideIndex(
            extraGuides, extraContext, {
                cursorPositionInLine: 8,
                lineText
            }
        );

        expect(IndentRange.getRangesForIndentGuides(
            context, guides,
            activeIndex < 0 ? undefined : guides[activeIndex]
        )).toMatchObject({
            guides: {
                stack: [0, 2],
                active: 3,
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
            extraContext, extraGuides,
            extraActiveIndex < 0 ? undefined : extraGuides[extraActiveIndex]
        )).toMatchObject({
            guides: {
                stack: [2, 3],
                active: 5,
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

    it(
        "should find rendering ranges when cursor is at the end of line",
        () => {
            let lineText = "  \t  abcdef";

            let context: EditorContext = {
                tabSize: 2,
                configurations: Configurations({
                    indent: {
                        firstIndent: true
                    },
                    active: {
                        extraIndent: false
                    }
                })
            };

            let guides = IndentGuide.getGuides(context, lineText) || [];
            let activeIndex = ActiveGuide.findActiveGuideIndex(
                guides, context, {
                    cursorPositionInLine: 11,
                    lineText
                }
            );

            let extraContext: EditorContext = {
                tabSize: 2,
                configurations: Configurations({
                    indent: {
                        firstIndent: false
                    },
                    active: {
                        extraIndent: true
                    }
                })
            };

            let extraGuides = IndentGuide.getGuides(
                extraContext, lineText
            ) || [];
            let extraActiveIndex = ActiveGuide.findActiveGuideIndex(
                extraGuides, extraContext, {
                    cursorPositionInLine: 11,
                    lineText
                }
            );

            expect(IndentRange.getRangesForIndentGuides(
                context, guides,
                activeIndex < 0 ? undefined : guides[activeIndex]
            )).toMatchObject({
                guides: {
                    stack: [0, 2],
                    active: 3,
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
                extraContext, extraGuides,
                (
                    extraActiveIndex < 0 ?
                    undefined : extraGuides[extraActiveIndex]
                )
            )).toMatchObject({
                guides: {
                    stack: [2, 3],
                    active: 5,
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
        }
    );
});
