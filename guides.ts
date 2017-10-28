import * as vscode from "vscode";

import GuidesBinder from "./binders/guides-binder";
import TelemetryBinder from "./binders/telemetry-binder";

import GuidesController from "./controllers/guides-controller";
import TelemetryController from "./controllers/telemetry-controller";

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(new GuidesBinder().bind(
        new GuidesController()
    ));
    context.subscriptions.push(new TelemetryBinder().bind(
        new TelemetryController()
    ));
}
