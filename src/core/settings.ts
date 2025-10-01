export class WxSettings {
    defaultStyle: string;
    defaultHighlight: string;
    showStyleUI: boolean;
    linkStyle: string;
    embedStyle: string;
    lineNumber: boolean;

    useCustomCss: boolean;
    customCSSNote: string;
    wxInfo: {name:string, appid:string, secret:string}[];
    math: string;

    baseCSS: string;
    watermark: string;
    useFigcaption: boolean;
    isLoaded: boolean = false;
    enableEmptyLine: boolean = false;

    fontFamily: string = 'sans-serif';
    fontSize: string = '16px';
    primaryColor: string = '#2d3748';
    customCSS: string = '';

    imageQuality: number = 0.9;
    imageMaxWidth: number = 1200;
    autoCompressImage: boolean = true;

    paragraphSpacing: string = '正常';
    firstLineIndent: boolean = false;
    headingAlign: string = 'left';

    defaultExportFormat: string = 'copy';
    autoSaveDraft: boolean = false;

    defaultWxAccount: string = '';

    previewWidth: number = 800;
    previewDelay: number = 500;

    private static instance: WxSettings;

    public static getInstance(): WxSettings {
        if (!WxSettings.instance) {
            WxSettings.instance = new WxSettings();
        }
        return WxSettings.instance;
    }

    private constructor() {
        this.defaultStyle = 'obsidian-light';
        this.defaultHighlight = '默认';
        this.showStyleUI = true;
        this.linkStyle = 'inline';
        this.embedStyle = 'content';
        this.lineNumber = true;
        this.useCustomCss = false;

        this.wxInfo = [];
        this.math = 'latex';
        this.baseCSS = '';
        this.watermark = '';
        this.useFigcaption = false;
        this.customCSSNote = '';
        this.enableEmptyLine = false;

        this.fontFamily = 'sans-serif';
        this.fontSize = '16px';
        this.primaryColor = '#2d3748';
        this.customCSS = '';

        this.imageQuality = 0.9;
        this.imageMaxWidth = 1200;
        this.autoCompressImage = true;
        this.paragraphSpacing = '正常';
        this.firstLineIndent = false;
        this.headingAlign = 'left';
        this.defaultExportFormat = 'copy';
        this.autoSaveDraft = false;
        this.defaultWxAccount = '';
        this.previewWidth = 800;
        this.previewDelay = 500;
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
            wxInfo,
            math,
            useCustomCss,
            baseCSS,
            watermark,
            useFigcaption,
            customCSSNote,
            ignoreEmptyLine,
            fontFamily,
            fontSize,
            primaryColor,
            customCSS,
            imageQuality,
            imageMaxWidth,
            autoCompressImage,
            paragraphSpacing,
            firstLineIndent,
            headingAlign,
            defaultExportFormat,
            autoSaveDraft,
            defaultWxAccount,
            previewWidth,
            previewDelay,
        } = data;

        const settings = WxSettings.getInstance();
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

        if (fontFamily) {
            settings.fontFamily = fontFamily;
        }
        if (fontSize) {
            settings.fontSize = fontSize;
        }
        if (primaryColor) {
            settings.primaryColor = primaryColor;
        }
        if (customCSS) {
            settings.customCSS = customCSS;
        }
        if (imageQuality !== undefined) {
            settings.imageQuality = imageQuality;
        }
        if (imageMaxWidth !== undefined) {
            settings.imageMaxWidth = imageMaxWidth;
        }
        if (autoCompressImage !== undefined) {
            settings.autoCompressImage = autoCompressImage;
        }
        if (paragraphSpacing) {
            settings.paragraphSpacing = paragraphSpacing;
        }
        if (firstLineIndent !== undefined) {
            settings.firstLineIndent = firstLineIndent;
        }
        if (headingAlign) {
            settings.headingAlign = headingAlign;
        }
        if (defaultExportFormat) {
            settings.defaultExportFormat = defaultExportFormat;
        }
        if (autoSaveDraft !== undefined) {
            settings.autoSaveDraft = autoSaveDraft;
        }
        if (defaultWxAccount) {
            settings.defaultWxAccount = defaultWxAccount;
        }
        if (previewWidth !== undefined) {
            settings.previewWidth = previewWidth;
        }
        if (previewDelay !== undefined) {
            settings.previewDelay = previewDelay;
        }

        settings.isLoaded = true;
    }

    public static allSettings() {
        const settings = WxSettings.getInstance();
        return {
            'defaultStyle': settings.defaultStyle,
            'defaultHighlight': settings.defaultHighlight,
            'showStyleUI': settings.showStyleUI,
            'linkStyle': settings.linkStyle,
            'embedStyle': settings.embedStyle,
            'lineNumber': settings.lineNumber,
            'wxInfo': settings.wxInfo,
            'math': settings.math,
            'useCustomCss': settings.useCustomCss,
            'baseCSS': settings.baseCSS,
            'watermark': settings.watermark,
            'useFigcaption': settings.useFigcaption,
            'customCSSNote': settings.customCSSNote,
            'ignoreEmptyLine': settings.enableEmptyLine,
            'fontFamily': settings.fontFamily,
            'fontSize': settings.fontSize,
            'primaryColor': settings.primaryColor,
            'customCSS': settings.customCSS,
            'imageQuality': settings.imageQuality,
            'imageMaxWidth': settings.imageMaxWidth,
            'autoCompressImage': settings.autoCompressImage,
            'paragraphSpacing': settings.paragraphSpacing,
            'firstLineIndent': settings.firstLineIndent,
            'headingAlign': settings.headingAlign,
            'defaultExportFormat': settings.defaultExportFormat,
            'autoSaveDraft': settings.autoSaveDraft,
            'defaultWxAccount': settings.defaultWxAccount,
            'previewWidth': settings.previewWidth,
            'previewDelay': settings.previewDelay,
        }
    }

}