import { Configurations } from "./configurations";

// Store indentation context, such as active level

export interface IndentContext {
    configurations: Configurations;
    tabSize: number;
    activeGuides?: {
        level: number;
        cursorPositionInLine: number;
    };
}

export default IndentContext;
