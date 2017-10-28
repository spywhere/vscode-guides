export interface Configurations {
    reload(): void;
    get<T>(section: string, defaultValue?: T): T | undefined;
}

export default Configurations;
