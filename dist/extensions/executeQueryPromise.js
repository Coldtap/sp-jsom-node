"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeQueryPromise = void 0;
const executeQueryPromise = (clientContext) => {
    return new Promise((resolve, reject) => {
        clientContext.executeQueryAsync(resolve, (...args) => reject(args[1].get_message()));
    });
};
exports.executeQueryPromise = executeQueryPromise;
//# sourceMappingURL=executeQueryPromise.js.map