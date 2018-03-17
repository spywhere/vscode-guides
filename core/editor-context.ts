import { Configurations } from "./configurations";

export interface EditorContext {
    configurations: Configurations;
    tabSize: number;
}

export default EditorContext;
