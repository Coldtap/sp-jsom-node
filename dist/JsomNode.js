"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsomNode = void 0;
const path = require("path");
const node_sp_auth_config_1 = require("node-sp-auth-config");
const sp_request_1 = require("sp-request");
const utils_1 = require("./utils");
const config_1 = require("./config");
require("./extensions/definitions");
const executeQueryPromise_1 = require("./extensions/executeQueryPromise");
function patchMicrosoftAjaxGlobal() {
    const origRegisterInterface = Type.prototype.registerInterface;
    Type.prototype.registerInterface = function (typeName) {
        if (['IEnumerator', 'IEnumerable', 'IDisposable'].indexOf(typeName) !== -1) {
            if (global[typeName]) {
                this.prototype.constructor = this;
                this.__typeName = typeName;
                this.__interface = true;
                return this;
            }
            global[typeName] = this;
        }
        return origRegisterInterface.apply(this, [].slice.call(arguments));
    };
}
global.navigator = {
    userAgent: 'trapbase',
};
let doc = {
    documentElement: {},
    cookie: '',
};
Object.defineProperty(global, 'document', {
    get: () => doc,
    set: (o) => {
        doc = o;
    },
});
global.window = global;
global.Type = Function;
global.location = {
    href: '',
    path: '',
    pathname: '',
    hash: '',
};
global.attachEvent = (args) => { };
global.parent = global.window;
require('../jsom/2016/1033/initstrings.debug.js');
require('../jsom/2016/init.debug.js');
require('../jsom/2016/msajaxbundle.debug.js');
patchMicrosoftAjaxGlobal();
require('../jsom/2016/sp.core.debug.js');
require('../jsom/2016/sp.runtime.debug.js');
require('../jsom/2016/sp.debug.js');
class JsomNode {
    constructor(settings = {}) {
        this.settings = settings;
        this.instanceId = utils_1.default.getGuid();
    }
    init(context) {
        const authOptions = context.authOptions;
        this.context = Object.assign(Object.assign({}, context), { authOptions });
        this.request = (0, sp_request_1.create)(this.context.authOptions);
        this.mimicBrowser();
        this.loadScripts(this.settings.modules, this.settings.envCode);
        this.proxyRequestManager();
        return this;
    }
    wizard(config = {}) {
        return new node_sp_auth_config_1.AuthConfig(config).getContext().then((ctx) => {
            this.context = {
                siteUrl: ctx.siteUrl,
                authOptions: ctx.authOptions,
            };
            this.settings = Object.assign(Object.assign({}, this.settings), {
                envCode: config.envCode || this.settings.envCode,
                modules: config.modules || this.settings.modules,
            });
            this.init(this.context);
            return ctx.siteUrl;
        });
    }
    getContext(siteUrl) {
        JsomNode.ctxs[this.instanceId] = this.request;
        siteUrl = siteUrl || this.context.siteUrl;
        const ctx = new SP.ClientContext(siteUrl);
        ctx.add_executingWebRequest((_sender, args) => {
            args.get_webRequest()._headers['X-JsomNode-InstanceID'] = this.instanceId;
        });
        return ctx;
    }
    dropContext() {
        delete JsomNode.ctxs[this.instanceId];
    }
    mimicBrowser() {
        global.navigator = {
            userAgent: 'sp-jsom-node',
        };
        global.window = {
            location: {
                href: '',
                pathname: '',
            },
            document: {
                cookie: '',
                URL: this.context.siteUrl,
            },
            setTimeout: global.setTimeout,
            clearTimeout: global.clearTimeout,
            attachEvent: () => {
            },
            _spPageContextInfo: {
                webServerRelativeUrl: `/${this.context.siteUrl.split('/').splice(3, 100).join('/')}`,
            },
        };
        global.document = {
            documentElement: {},
            URL: '',
            getElementsByTagName: (name) => [],
        };
        global.Type = Function;
        global.NotifyScriptLoadedAndExecuteWaitingJobs = (scriptFileName) => { };
        global.RegisterModuleInit = () => { };
        global.ExecuteOrDelayUntilScriptLoaded = (callback, jsomScript) => {
            jsomScript = jsomScript.replace('.debug.js', '').replace('.js', '') + '.debug.js';
            if (global.loadedJsomScripts.indexOf(jsomScript.toLowerCase()) === -1) {
                const filePath = path.join(__dirname, '..', 'jsom', global.envCode || 'spo', jsomScript);
                utils_1.default.require(filePath);
                callback();
            }
            else {
                callback();
            }
        };
        (() => {
            const registerNamespace = (namespaceString) => {
                let curNs = global;
                global.window = global.window || {};
                namespaceString.split('.').forEach((ns) => {
                    if (typeof curNs[ns] === 'undefined') {
                        curNs[ns] = new Object();
                    }
                    curNs = curNs[ns];
                    curNs.__namespace = true;
                });
                const nsName = namespaceString.split('.')[0];
                global.window[nsName] = global[nsName];
            };
            registerNamespace('Sys');
            registerNamespace('SP');
            registerNamespace('Microsoft');
            registerNamespace('PS');
            registerNamespace('Srch');
            try {
                registerNamespace('SP.Utilities');
                global.SP.Utilities.HttpUtility = SP.Utilities.HttpUtility || {};
            }
            catch (ex) {
            }
        })();
    }
    loadScripts(modules = ['core'], envCode = 'spo') {
        global.envCode = envCode;
        global.loadedJsomScripts = global.loadedJsomScripts || [];
        if (modules.indexOf('core') !== 0) {
            modules = ['core'].concat(modules);
        }
        modules
            .filter((value, index, self) => self.indexOf(value) === index)
            .forEach((module) => {
            config_1.JsomModules[module].forEach((jsomScript) => {
                if (global.loadedJsomScripts.indexOf(jsomScript.toLowerCase()) === -1) {
                    global.loadedJsomScripts.push(jsomScript.toLowerCase());
                }
            });
        });
        (() => {
            SP.ClientRuntimeContext.prototype.executeQueryPromise = function () {
                return (0, executeQueryPromise_1.executeQueryPromise)(this);
            };
        })();
    }
    patchMicrosoftAjax() {
        patchMicrosoftAjaxGlobal();
    }
    proxyRequestManager() {
        let request = this.request;
        Sys.Net._WebRequestManager.prototype.executeRequest = (wReq) => {
            const instanceId = wReq._headers['X-JsomNode-InstanceID'];
            request = JsomNode.ctxs[instanceId] || request;
            const hostUrl = this.context.siteUrl.split('/').splice(0, 3).join('/');
            const requestUrl = utils_1.default.isUrlAbsolute(wReq._url) ? wReq._url : `${hostUrl}${wReq._url}`;
            const webAbsoluteUrl = requestUrl.split('/_api')[0].split('/_vti_bin')[0];
            this.currentDigestRequest = request
                .requestDigest(webAbsoluteUrl)
                .then((digest) => {
                const isJsom = wReq._url.indexOf('/_vti_bin/client.svc/ProcessQuery') !== -1;
                const jsomHeaders = !isJsom
                    ? {}
                    : {
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-RequestDigest': digest,
                    };
                if (wReq._httpVerb.toLowerCase() === 'post') {
                    const res = request
                        .post(requestUrl, {
                        headers: Object.assign(Object.assign({}, wReq._headers), jsomHeaders),
                        body: wReq._body,
                    })
                        .then((response) => {
                        const bodyPromise = !isJsom ? response.json() : response.text();
                        bodyPromise.then((body) => {
                            const responseData = isJsom ? body : JSON.stringify(body);
                            wReq._events._list.completed[0]({
                                _xmlHttpRequest: {
                                    status: response.status,
                                    responseText: responseData,
                                },
                                get_statusCode: () => response.status,
                                get_responseData: () => responseData,
                                getResponseHeader: (header) => response.headers.get(header.toLowerCase()),
                                get_aborted: () => false,
                                get_timedOut: () => false,
                                get_responseAvailable: () => true,
                            });
                        });
                    });
                }
            })
                .catch((error) => {
                throw new Error(error);
            });
        };
    }
}
exports.JsomNode = JsomNode;
JsomNode.ctxs = {};
//# sourceMappingURL=JsomNode.js.map