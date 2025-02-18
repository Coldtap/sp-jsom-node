export default class Utils {
    static require: any;
    static isOnPrem(url: string): boolean;
    static isUrlHttps(url: string): boolean;
    static isUrlAbsolute(url: string): boolean;
    static combineUrl(...args: string[]): string;
    static getGuid(): string;
}
