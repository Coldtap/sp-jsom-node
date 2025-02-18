import { IJsomNodeSettings, IConfigSettings, IJsomNodeContext } from './IJsomNode';
import './extensions/definitions';
export declare class JsomNode {
    private static ctxs;
    private settings;
    private context;
    private request;
    private instanceId;
    currentDigestRequest?: Promise<void>;
    constructor(settings?: IJsomNodeSettings);
    init(context: IJsomNodeContext): JsomNode;
    wizard(config?: IConfigSettings): Promise<string>;
    getContext(siteUrl?: string): SP.ClientContext;
    dropContext(): void;
    private mimicBrowser;
    private loadScripts;
    private patchMicrosoftAjax;
    private proxyRequestManager;
}
