import { wxKeyInfo } from '../services/wechat/weixin-api';

export class NMPSettings {
    defaultStyle: string;
    defaultHighlight: string;
    showStyleUI: boolean;
    linkStyle: string;
    embedStyle: string;
    lineNumber: boolean;
    authKey: string;
    useCustomCss: boolean;
    customCSSNote: string;

    wxInfo: {name:string, appid:string, secret:string}[];
    math: string;
    expireat: Date | null = null;
    isVip: boolean = false;
    baseCSS: string;
    watermark: string;
    useFigcaption: boolean;

    isLoaded: boolean = false;
    enableEmptyLine: boolean = false;

    fontFamily: string = '等线';
    fontSize: string = '推荐';
    primaryColor: string = '#2d3748';
    customCSS: string = '';

    private static instance: NMPSettings;

    public static getInstance(): NMPSettings {
        if (!NMPSettings.instance) {
            NMPSettings.instance = new NMPSettings();
        }
        return NMPSettings.instance;
    }

    private constructor() {
        this.defaultStyle = 'obsidian-light';
        this.defaultHighlight = '默认';
        this.showStyleUI = true;
        this.linkStyle = 'inline';
        this.embedStyle = 'content';
        this.lineNumber = true;
        this.useCustomCss = false;

        this.authKey = 'temp-backend-api-key';
        this.wxInfo = [];
        this.math = 'latex';
        this.baseCSS = '';
        this.watermark = '';
        this.useFigcaption = false;
        this.customCSSNote = '';

        this.enableEmptyLine = false;

        this.fontFamily = '等线';
        this.fontSize = '推荐';
        this.primaryColor = '#2d3748';
        this.customCSS = '';
    }

    resetStyelAndHighlight() {
        this.defaultStyle = 'obsidian-light';
        this.defaultHighlight = '默认';
    }

    public static loadSettings(data: any) {
        if (!data) {
            return
        }
        const {
            defaultStyle,
            linkStyle,
            embedStyle,
            showStyleUI,
            lineNumber,
            defaultHighlight,
            authKey,
            wxInfo,
            math,
            useCustomCss,
            baseCSS,
            watermark,
            useFigcaption,
            customCSSNote,

            ignoreEmptyLine,
        } = data;

        const settings = NMPSettings.getInstance();
        if (defaultStyle) {
            settings.defaultStyle = defaultStyle;
        }
        if (defaultHighlight) {
            settings.defaultHighlight = defaultHighlight;
        }
        if (showStyleUI !== undefined) {
            settings.showStyleUI = showStyleUI;
        }
        if (linkStyle) {
            settings.linkStyle = linkStyle;
        }
        if (embedStyle) {
            settings.embedStyle = embedStyle;
        }
        if (lineNumber !== undefined) {
            settings.lineNumber = lineNumber;
        }
        if (authKey) {
            settings.authKey = authKey;
        }
        if (wxInfo) {
            settings.wxInfo = wxInfo;
        }
        if (math) {
            settings.math = math;
        }
        if (useCustomCss !== undefined) {
            settings.useCustomCss = useCustomCss;
        }
        if (baseCSS) {
            settings.baseCSS = baseCSS;
        }
        if (watermark) {
            settings.watermark = watermark;
        }
        if (useFigcaption !== undefined) {
            settings.useFigcaption = useFigcaption;
        }
        if (customCSSNote) {
            settings.customCSSNote = customCSSNote;
        }

        if (ignoreEmptyLine !== undefined) {
            settings.enableEmptyLine = ignoreEmptyLine;
        }
        settings.getExpiredDate();
        settings.isLoaded = true;
    }

    public static allSettings() {
        const settings = NMPSettings.getInstance();
        return {
            'defaultStyle': settings.defaultStyle,
            'defaultHighlight': settings.defaultHighlight,
            'showStyleUI': settings.showStyleUI,
            'linkStyle': settings.linkStyle,
            'embedStyle': settings.embedStyle,
            'lineNumber': settings.lineNumber,
            'authKey': settings.authKey,
            'wxInfo': settings.wxInfo,
            'math': settings.math,
            'useCustomCss': settings.useCustomCss,
            'baseCSS': settings.baseCSS,
            'watermark': settings.watermark,
            'useFigcaption': settings.useFigcaption,
            'customCSSNote': settings.customCSSNote,

            'ignoreEmptyLine': settings.enableEmptyLine,
        }
    }

    getExpiredDate() {
        if (this.authKey.length == 0) return;
        wxKeyInfo(this.authKey).then((res) => {
            if (res.status == 200) {
                if (res.json.vip) {
                    this.isVip = true;
                }
                this.expireat = new Date(res.json.expireat);
            }
        })
    }

    isAuthKeyVaild() {

        return true;

        // if (this.authKey.length == 0) return false;
        // if (this.isVip) return true;
        // if (this.expireat == null) return false;
        // return this.expireat > new Date();
    }
}