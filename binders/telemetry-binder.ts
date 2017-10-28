import * as vscode from "vscode";
import BaseBinder from "./base-binder";
import TelemetryDelegate from "../protocols/telemetry-delegate";

export class TelemetryBinder extends BaseBinder<TelemetryDelegate> {}

export default TelemetryBinder;
