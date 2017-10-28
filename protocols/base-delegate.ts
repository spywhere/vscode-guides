export interface BaseDelegate {
    onWillLoad?(): void;
    onDidLoad?(): void;
    onWillUnload?(): void;
}

export default BaseDelegate;
