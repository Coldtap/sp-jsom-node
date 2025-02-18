"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Utils {
    static isOnPrem(url) {
        return url.indexOf('.sharepoint.com') === -1 && url.indexOf('.sharepoint.cn') === -1;
    }
    static isUrlHttps(url) {
        return url.split('://')[0].toLowerCase() === 'https';
    }
    static isUrlAbsolute(url) {
        return url.indexOf('http:') === 0 || url.indexOf('https:') === 0;
    }
    static combineUrl(...args) {
        return args.join('/').replace(/(\/)+/g, '/').replace(':/', '://');
    }
    static getGuid() {
        const S4 = () => {
            return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
        };
        const guid = (S4() +
            S4() +
            '-' +
            S4() +
            '-4' +
            S4().substr(0, 3) +
            '-' +
            S4() +
            '-' +
            S4() +
            S4() +
            S4()).toLowerCase();
        return guid;
    }
}
Utils.require = typeof __webpack_require__ === 'function' ? __non_webpack_require__ : require;
exports.default = Utils;
//# sourceMappingURL=utils.js.map