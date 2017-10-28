import Configurations from "../../core/implementations/mock-configurations";
import IndentContext from "../../core/indent-context";
import * as IndentGuide from "../../core/indent-guide";

describe("indent-guide", () => {
    it(
        "should find a proper tab stop from a specified indentation context",
        () => {
            let context: IndentContext = {
                tabSize: 4,
                configurations: Configurations()
            };

            expect(IndentGuide.getGuides(context, "")).toBeUndefined();

            expect(IndentGuide.getGuides(context, "  ", {
                isEmptyOrWhitespace: true
            })).toBeUndefined();

            expect(IndentGuide.getGuides(context, "  ")).toMatchObject([]);

            expect(IndentGuide.getGuides(context, "  ", {
                firstNonWhitespaceCharacterIndex: 2
            })).toMatchObject([]);

            expect(IndentGuide.getGuides(context, "   ")).toMatchObject([]);

            expect(IndentGuide.getGuides(context, "    ")).toMatchObject([{
                type: "start",
                position: 0,
                indentLevel: 0
            }, {
                type: "end",
                position: 4,
                indentLevel: 1
            }]);

            expect(IndentGuide.getGuides(context, "\t")).toMatchObject([{
                type: "start",
                position: 0,
                indentLevel: 0
            }, {
                type: "end",
                position: 1,
                indentLevel: 1
            }]);

            expect(IndentGuide.getGuides(context, "  \t")).toMatchObject([{
                type: "start",
                position: 0,
                indentLevel: 0
            }, {
                type: "end",
                position: 3,
                indentLevel: 1
            }]);

            expect(IndentGuide.getGuides(context, "\t  ")).toMatchObject([{
                type: "start",
                position: 0,
                indentLevel: 0
            }, {
                type: "normal",
                position: 1,
                indentLevel: 1
            }]);

            expect(IndentGuide.getGuides(context, "\t\ta\tb")).toMatchObject([{
                type: "start",
                position: 0,
                indentLevel: 0
            }, {
                type: "normal",
                position: 1,
                indentLevel: 1
            }, {
                type: "end",
                position: 2,
                indentLevel: 2
            }]);

            expect(IndentGuide.getGuides(
                context, "\t\t    \ta\tb"
            )).toMatchObject([{
                type: "start",
                position: 0,
                indentLevel: 0
            }, {
                type: "normal",
                position: 1,
                indentLevel: 1
            }, {
                type: "normal",
                position: 2,
                indentLevel: 2
            }, {
                type: "normal",
                position: 6,
                indentLevel: 3
            }, {
                type: "end",
                position: 7,
                indentLevel: 4
            }]);
        }
    );
});
