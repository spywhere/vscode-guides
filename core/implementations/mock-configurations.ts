import * as _ from "lodash";
import Configurations from "../configurations";

export class MockConfigurations implements Configurations {
    configurations: {
        [key: string]: any;
    } = {};

    constructor(configurations?: {
        [key: string]: any;
    }) {
        if (configurations) {
            this.configurations = configurations;
        }
    }

    reload() {
        // Omit intended
    }

    get<T>(section: string, defaultValue?: T) {
        return _.get<
            {
                [key: string]: any;
            },
            string,
            T | undefined
        >(this.configurations, section, defaultValue);
    }
}

export default (configurations?: {
    [key: string]: any;
}) => new MockConfigurations(configurations);
