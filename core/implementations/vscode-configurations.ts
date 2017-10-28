import Configurations from "../configurations";
import * as vscode from "vscode";

export class VSCodeConfigurations implements Configurations {
    configurations: vscode.WorkspaceConfiguration;

    constructor() {
        this.reload();
    }

    reload() {
        this.configurations = vscode.workspace.getConfiguration("guides");
    }

    get<T>(section: string, defaultValue?: T) {
        return this.configurations.get(section, defaultValue);
    }
}

export default () => new VSCodeConfigurations();
