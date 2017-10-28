import * as semver from "semver";
import { version } from "vscode";

export function isEqualOrNewerVersionThan(
    major: number,
    minor: number,
    patch: number
){
    return semver.gte(version, `${ major }.${ minor }.${ patch }`);
}
