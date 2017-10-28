import * as vscode from "vscode";
import BaseDelegate from "../protocols/base-delegate";

export class BaseBinder<T extends BaseDelegate> {
    protected disposable: vscode.Disposable | undefined;
    protected handlers: T[] = [];

    bind(...handlers: T[]){
        handlers.forEach((handler) => {
            this.handlers.push(handler);

            if (handler.onDidLoad) {
                handler.onDidLoad();
            }
        });

        return this;
    }

    dispose() {
        this.handlers.forEach((handler) => {
            if (handler.onWillUnload) {
                handler.onWillUnload();
            }
        });
        this.handlers = [];

        if (this.disposable) {
            this.disposable.dispose();
        }
    }
}

export default BaseBinder;
