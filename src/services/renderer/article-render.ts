import { App, ItemView, Workspace, Notice, sanitizeHTMLToDom, apiVersion, TFile, MarkdownRenderer, FrontMatterCache } from 'obsidian';

import { applyCSS, serializeElementChildren } from '../../shared/utils';
import { UploadImageToWx } from '../wechat/imagelib';
import { WxSettings } from '../../core/settings';
import AssetsManager from '../../core/assets';
import InlineCSS from '../../shared/inline-css';

import { WechatClient, initApiClients, getWechatClient } from '../api';

import { DraftArticle, DraftImageMediaId, DraftImages } from '../wechat/weixin-api';
import { MDRendererCallback } from './markdown/extension';
import { MarkedParser } from './markdown/parser';
import { LocalImageManager, LocalFile } from './markdown/local-file';
import { CardDataManager } from './markdown/code';
import { debounce } from '../../shared/utils';
import { PrepareImageLib, IsImageLibReady, WebpToJPG } from '../wechat/imagelib';
import { toPng } from 'html-to-image';

const FRONT_MATTER_REGEX = /^(---)$.+?^(---)$.+?/ims;

export class ArticleRender implements MDRendererCallback {
  app: App;
  itemView: ItemView;
  workspace: Workspace;
  styleEl: HTMLElement;
  articleDiv: HTMLDivElement;
  settings: WxSettings;
  assetsManager: AssetsManager;
  articleHTML: string;
  title: string;
  _currentTheme: string;
  _currentHighlight: string;
  _currentAppId: string;
  markedParser: MarkedParser;
  cachedElements: Map<string, string> = new Map();
  debouncedRenderMarkdown: (...args: any[]) => void;

  wechatClient: WechatClient;

  constructor(app: App, itemView: ItemView, styleEl: HTMLElement, articleDiv: HTMLDivElement) {
    this.app = app;
    this.itemView = itemView;
    this.styleEl = styleEl;
    this.articleDiv = articleDiv;
    this.settings = WxSettings.getInstance();
    this.assetsManager = AssetsManager.getInstance();
    this.articleHTML = '';
    this.title = '';
    this._currentTheme = 'default';
    this._currentHighlight = 'default';
    this.markedParser = new MarkedParser(app, this);
    this.debouncedRenderMarkdown = debounce(this.renderMarkdown.bind(this), 1000);

    try {
      initApiClients();
      this.wechatClient = getWechatClient();
    } catch (error) {

    }
  }

  set currentTheme(value: string) {
    this._currentTheme = value;
  }

  get currentTheme() {
    const { theme } = this.getMetadata();
    if (theme) {
      return theme;
    }
    return this._currentTheme;
  }

  set currentHighlight(value: string) {
    this._currentHighlight = value;
  }

  get currentHighlight() {
    const { highlight } = this.getMetadata();
    if (highlight) {
      return highlight;
    }
    return this._currentHighlight;
  }

  isOldTheme() {
    const theme = this.assetsManager.getTheme(this.currentTheme);
    if (theme) {
      return theme.css.indexOf('.wdwxedit') < 0;
    }
    return false;
  }

  setArticle(article: string) {
    this.articleDiv.empty();
    let className = 'wdwxedit';

    if (this.isOldTheme()) {
      className = this.currentTheme;
    }
    const html = `<section class="${className}" id="article-section">${article}</section>`;
    const doc = sanitizeHTMLToDom(html);
    if (doc.firstChild) {
      this.articleDiv.appendChild(doc.firstChild);
    }
  }

  setStyle(css: string) {
    this.styleEl.empty();
    this.styleEl.appendChild(document.createTextNode(css));
  }

  reloadStyle() {
    this.setStyle(this.getCSS());
  }

  getArticleSection() {
    return this.articleDiv.querySelector('#article-section') as HTMLElement;
  }

  getArticleContent() {
    const content = serializeElementChildren(this.articleDiv);
    let html = applyCSS(content, this.getCSS());

    html = html.replace(/rel="noopener nofollow"/g, '');
    html = html.replace(/target="_blank"/g, '');
    html = html.replace(/data-leaf=""/g, 'leaf=""');
    return CardDataManager.getInstance().restoreCard(html);
  }

  getArticleText() {
    return this.articleDiv.innerText.trimStart();
  }

  errorContent(error: any) {
    return '<h1>渲染失败!</h1><br/>'
      + '如需帮助请前往&nbsp;&nbsp;<a href="https://github.com/IsHexx/WDWXEdit/issues">https://github.com/IsHexx/WDWXEdit/issues</a>&nbsp;&nbsp;反馈<br/><br/>'
      + '如果方便，请提供引发错误的完整Markdown内容。<br/><br/>'
      + '<br/>Obsidian版本：' + apiVersion
      + '<br/>错误信息：<br/>'
      + `${error}`;
  }

  async renderMarkdown(af: TFile | null = null) {
    try {
      let md = '';
      if (af && af.extension.toLocaleLowerCase() === 'md') {
        md = await this.app.vault.adapter.read(af.path);
        this.title = af.basename;
      }
      else {
        md = '没有可渲染的笔记或文件不支持渲染';
      }
      if (md.startsWith('---')) {
        md = md.replace(FRONT_MATTER_REGEX, '');
      }

      this.articleHTML = await this.markedParser.parse(md);
      this.setStyle(this.getCSS());
      this.setArticle(this.articleHTML);
      await this.processCachedElements();
    }
    catch (e) {

      this.setArticle(this.errorContent(e));
    }
  }

  getCSS() {
    try {
      const theme = this.assetsManager.getTheme(this.currentTheme);
      const highlight = this.assetsManager.getHighlight(this.currentHighlight);
      const customCSS = this.settings.customCSSNote.length > 0 || this.settings.useCustomCss ? this.assetsManager.customCSS : '';
      const baseCSS = this.settings.baseCSS ? `.wdwxedit {${this.settings.baseCSS}}` : '';

      const styleEditorCSS = this.buildStyleEditorCSS();
      
      return `${InlineCSS}\n\n${highlight!.css}\n\n${theme!.css}\n\n${baseCSS}\n\n${customCSS}\n\n${this.settings.customCSS}\n\n${styleEditorCSS}`;
    } catch (error) {

      new Notice(`获取样式失败${this.currentTheme}|${this.currentHighlight}，请检查主题是否正确安装。`);
    }
    return '';
  }

  updateStyle(styleName: string) {
    this.currentTheme = styleName;
    this.setStyle(this.getCSS());
  }

  updateHighLight(styleName: string) {
    this.currentHighlight = styleName;
    this.setStyle(this.getCSS());
  }

  private buildStyleEditorCSS(): string {
    const cssRules: string[] = [];

    if (this.settings.fontFamily) {
      const fontFamilyValue = this.mapFontFamily(this.settings.fontFamily);
      cssRules.push(`
        section#article-section.wdwxedit,
        section#article-section.wdwxedit *,
        .wdwxedit, 
        .wdwxedit *, 
        .wdwxedit p, 
        .wdwxedit h1, 
        .wdwxedit h2, 
        .wdwxedit h3, 
        .wdwxedit h4, 
        .wdwxedit h5, 
        .wdwxedit h6,
        .wdwxedit div,
        .wdwxedit span,
        .wdwxedit li,
        .wdwxedit td,
        .wdwxedit th { 
          font-family: ${fontFamilyValue} !important; 
        }
      `);

    }

    if (this.settings.fontSize) {
      const fontSizeValue = this.mapFontSize(this.settings.fontSize);
      cssRules.push(`
        section#article-section.wdwxedit,
        .wdwxedit { 
          font-size: ${fontSizeValue} !important; 
        }
        section#article-section.wdwxedit p,
        section#article-section.wdwxedit div,
        section#article-section.wdwxedit span,
        section#article-section.wdwxedit li,
        .wdwxedit p, 
        .wdwxedit div, 
        .wdwxedit span,
        .wdwxedit li { 
          font-size: inherit !important; 
        }
      `);

    }

    if (this.settings.primaryColor) {
      cssRules.push(`
        section#article-section.wdwxedit h1,
        div.wdwxedit h1,
        .wdwxedit h1 { 
          color: ${this.settings.primaryColor} !important; 
        }
        section#article-section.wdwxedit h2,
        div.wdwxedit h2,
        .wdwxedit h2 { 
          color: ${this.settings.primaryColor} !important; 
        }
        section#article-section.wdwxedit h3,
        div.wdwxedit h3,
        .wdwxedit h3 { 
          color: ${this.settings.primaryColor} !important; 
        }
        section#article-section.wdwxedit h4,
        div.wdwxedit h4,
        .wdwxedit h4 { 
          color: ${this.settings.primaryColor} !important; 
        }
        section#article-section.wdwxedit h5,
        div.wdwxedit h5,
        .wdwxedit h5 { 
          color: ${this.settings.primaryColor} !important; 
        }
        section#article-section.wdwxedit h6,
        div.wdwxedit h6,
        .wdwxedit h6 { 
          color: ${this.settings.primaryColor} !important; 
        }
      `);

    }

    return cssRules.join('\n');
  }

  private mapFontFamily(fontFamily: string): string {
    const fontMap: { [key: string]: string } = {
      '等线': '"DengXian", "Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", "Helvetica Neue", Arial, sans-serif',
      '无衬线': '-apple-system, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei UI", "Microsoft YaHei", Arial, sans-serif',
      '衬线': 'Georgia, "Times New Roman", "STSong", serif',
      '等宽': '"Fira Code", "SF Mono", Monaco, Inconsolata, "Roboto Mono", "Source Code Pro", Menlo, Consolas, "DejaVu Sans Mono", monospace'
    };
    return fontMap[fontFamily] || fontFamily;
  }

  private mapFontSize(fontSize: string): string {

    const sizeMap: { [key: string]: string } = {
      '小': '14px',
      '推荐': '16px',
      '大': '18px',
      '特大': '20px',

      '14px': '14px',
      '16px': '16px',
      '18px': '18px',
      '20px': '20px',
      '22px': '22px',
      '24px': '24px'
    };
    return sizeMap[fontSize] || fontSize;
  }

  updateFont(fontFamily: string) {

    this.setStyle(this.getCSS());
  }

  updateFontSize(fontSize: string) {

    this.setStyle(this.getCSS());
  }

  updatePrimaryColor(color: string) {

    this.setStyle(this.getCSS());
  }

  updateCustomCSS(css: string) {

    this.setStyle(this.getCSS());
  }

  getFrontmatterValue(frontmatter: FrontMatterCache, key: string) {
    const value = frontmatter[key];

    if (value instanceof Array) {
      return value[0];
    }

    return value;
  }

  getMetadata() {
    let res: DraftArticle = {
      title: '',
      author: undefined,
      digest: undefined,
      content: '',
      content_source_url: undefined,
      cover: undefined,
      thumb_media_id: '',
      need_open_comment: undefined,
      only_fans_can_comment: undefined,
      pic_crop_235_1: undefined,
      pic_crop_1_1: undefined,
      appid: undefined,
      theme: undefined,
      highlight: undefined,
    }
    const file = this.app.workspace.getActiveFile();
    if (!file) return res;
    const metadata = this.app.metadataCache.getFileCache(file);
    if (metadata?.frontmatter) {
      const frontmatter = metadata.frontmatter;
      res.title = this.getFrontmatterValue(frontmatter, 'title');
      res.author = this.getFrontmatterValue(frontmatter, 'author');
      res.digest = this.getFrontmatterValue(frontmatter, 'digest');
      res.content_source_url = this.getFrontmatterValue(frontmatter, 'content_source_url');
      res.cover = this.getFrontmatterValue(frontmatter, 'cover');
      res.thumb_media_id = this.getFrontmatterValue(frontmatter, 'thumb_media_id');
      res.need_open_comment = frontmatter['need_open_comment'] ? 1 : undefined;
      res.only_fans_can_comment = frontmatter['only_fans_can_comment'] ? 1 : undefined;
      res.appid = this.getFrontmatterValue(frontmatter, 'appid');
      if (res.appid && !res.appid.startsWith('wx')) {
        res.appid = this.settings.wxInfo.find(wx => wx.name === res.appid)?.appid;
      }
      res.theme = this.getFrontmatterValue(frontmatter, 'theme');
      res.highlight = this.getFrontmatterValue(frontmatter, 'highlight');
      if (frontmatter['crop']) {
        res.pic_crop_235_1 = '0_0_1_0.5';
        res.pic_crop_1_1 = '0_0.525_0.404_1';
      }
    }
    return res;
  }

  async uploadVaultCover(name: string, token: string) {
    const LocalFileRegex = /^!\[\[(.*?)\]\]/;
    const matches = name.match(LocalFileRegex);
    let fileName = '';
    if (matches && matches.length > 1) {
      fileName = matches[1];
    }
    else {
      fileName = name;
    }

    const vault = this.app.vault;
    const file = this.assetsManager.searchFile(fileName);

    if (!file || !(file instanceof TFile)) {
      throw new Error('找不到封面文件: ' + fileName);
    }
    const fileData = await vault.readBinary(file);

    return await this.uploadCover(new Blob([fileData]), file.name, token);
  }

  async uploadCover(data: Blob, filename: string, token: string) {
    if (filename.toLowerCase().endsWith('.webp')) {
      await PrepareImageLib();
      if (IsImageLibReady()) {
        data = new Blob([WebpToJPG(await data.arrayBuffer())]);
        filename = filename.toLowerCase().replace('.webp', '.jpg');
      }
    }

    const res = await UploadImageToWx(data, filename, token, 'image');
    if (res.media_id) {
      return res.media_id;
    }

    throw new Error('上传封面失败: ' + res.errmsg);
  }

  async getDefaultCover(token: string) {
    try {

      if (!this.wechatClient) {
        initApiClients();
        this.wechatClient = getWechatClient();
      }
      
      const response = await this.wechatClient.getMediaList({
        accessToken: token,
        type: 'image',
        count: 1,
        offset: 0
      });
      if (response.item_count && response.item_count > 0 && response.item) {

        return response.item[0].media_id;
      }
    } catch (error) {

    }
    return '';
  }

  async getToken(appid: string) {
    const secret = this.getSecret(appid);

    if (!secret || secret.length === 0) {
      throw new Error('公众号AppSecret未配置，请在设置中配置公众号信息');
    }

    try {

      if (!this.wechatClient) {
        initApiClients();
        this.wechatClient = getWechatClient();
      }

      const response = await this.wechatClient.authenticate({
        appId: appid,
        appSecret: secret
      });
      return response.access_token;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      if (errorMsg.includes('CORS') || errorMsg.includes('fetch') || errorMsg.includes('Failed to fetch')) {
        throw new Error('无法连接到服务器，请检查网络连接或后端服务是否启动');
      } else if (errorMsg.includes('40001') || errorMsg.includes('AppSecret')) {
        throw new Error('AppSecret无效，请检查公众号配置');
      } else if (errorMsg.includes('40013') || errorMsg.includes('AppID')) {
        throw new Error('AppID无效，请检查公众号配置');
      } else if (errorMsg.includes('40164') || errorMsg.includes('IP') || errorMsg.includes('whitelist')) {

        let ipAddress = '未知';

        const ipMatch = errorMsg.match(/(?:invalid\s+ip|IP|ip)[:\s]+(\d+\.\d+\.\d+\.\d+)/i);
        if (ipMatch) {
          ipAddress = ipMatch[1];
        } else {

          const pureIpMatch = errorMsg.match(/(\d+\.\d+\.\d+\.\d+)/);
          if (pureIpMatch) {
            ipAddress = pureIpMatch[1];
          }
        }
        throw new Error(`IP地址 ${ipAddress} 不在白名单中，请在微信公众平台添加此IP到白名单`);
      } else if (errorMsg.includes('timeout') || errorMsg.includes('超时')) {
        throw new Error('请求超时，请检查网络连接');
      } else {
        throw new Error('Token获取失败: ' + errorMsg);
      }
    }
  }

  async uploadImages(appid: string) {
    let metadata = this.getMetadata();
    if (metadata.appid) {
      appid = metadata.appid;
    }

    if (!appid || appid.length == 0) {
      throw new Error('请先选择公众号');
    }

    const token = await this.getToken(appid);
    if (token === '') {
      return;
    }

    await this.cachedElementsToImages();

    const lm = LocalImageManager.getInstance();

    await lm.uploadLocalImage(token, this.app.vault);

    await lm.uploadRemoteImage(this.articleDiv, token);

    lm.replaceImages(this.articleDiv);

  }

  async copyArticle() {
    const htmlContent = this.getArticleContent();
    const plainText = this.getArticleText();

    if (!htmlContent) {
      throw new Error('暂无可复制的内容');
    }

    try {
      const w = window as any;
      const electron = w?.require ? w.require('electron') : undefined;
      const electronClipboard = electron?.clipboard;
      if (electronClipboard && typeof electronClipboard.write === 'function') {
        electronClipboard.write({ html: htmlContent, text: plainText });
        return;
      }
    } catch (e) {

    }

    // Web剪贴板API方案
    const clipboard = navigator.clipboard;
    const canUseClipboardItem = typeof ClipboardItem !== 'undefined';

    if (clipboard && canUseClipboardItem && window.isSecureContext) {
      try {

        if (document.hasFocus && !document.hasFocus()) {
          window.focus();
          await new Promise((r) => setTimeout(r, 120));
        }

        await clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([htmlContent], { type: 'text/html' }),
            'text/plain': new Blob([plainText], { type: 'text/plain' })
          })
        ]);
        return;
      } catch (error) {
        if (error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'SecurityError')) {

        } else if (error instanceof Error && error.message.includes('Document is not focused')) {

        } else {

        }
      }
    }

    if (this.copyArticleWithExecCommand(htmlContent, plainText)) {
      return;
    }

    throw new Error('剪贴板复制失败：请确认Obsidian窗口处于活动状态后重试。');
  }

  private copyArticleWithExecCommand(htmlContent: string, plainText: string): boolean {
    try {
      const selection = window.getSelection();
      if (!selection) {
        return false;
      }

      const container = document.createElement('div');
      container.classList.add('wdwx-clipboard-container');
      container.setAttribute('aria-hidden', 'true');
      container.contentEditable = 'true';
      const fragment = sanitizeHTMLToDom(htmlContent);
      container.appendChild(fragment);

      document.body.appendChild(container);

      const range = document.createRange();
      range.selectNodeContents(container);

      selection.removeAllRanges();
      selection.addRange(range);

      (container as any).focus?.();

      let successful = document.execCommand('copy');

      selection.removeAllRanges();
      document.body.removeChild(container);

      if (successful) {
        return true;
      }

      const textarea = document.createElement('textarea');
      textarea.value = plainText;
      textarea.setAttribute('readonly', 'true');
      textarea.classList.add('wdwx-clipboard-textarea');

      document.body.appendChild(textarea);

      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);

      successful = document.execCommand('copy');

      document.body.removeChild(textarea);

      return successful;
    } catch (error) {

      return false;
    }
  }

  getSecret(appid: string) {
    for (const wx of this.settings.wxInfo) {
      if (wx.appid === appid) {
        return wx.secret.replace('SECRET', '');
      }
    }
    return '';
  }

  async postArticle(appid:string, localCover: File | null = null) {
    throw new Error('此方法已废弃，请使用note-preview.ts中的新调用链');
  }

  async postImages(appid: string) {
    let metadata = this.getMetadata();
    if (metadata.appid) {
      appid = metadata.appid;
    }

    if (!appid || appid.length == 0) {
      throw new Error('请先选择公众号');
    }

    const token = await this.getToken(appid);
    if (token === '') {
      throw new Error('获取token失败,请检查网络链接!');
    }

    const imageList: DraftImageMediaId[] = [];
    const lm = LocalImageManager.getInstance();

    await lm.uploadLocalImage(token, this.app.vault, 'image');

    await lm.uploadRemoteImage(this.articleDiv, token, 'image');

    const images = lm.getImageInfos(this.articleDiv);
    for (const image of images) {
      if (!image.media_id) {

        continue;
      }
      imageList.push({
        image_media_id: image.media_id,
      });
    }

    if (imageList.length === 0) {
      throw new Error('没有图片需要发布!');
    }

    const content = this.getArticleText();

    const imagesData: DraftImages = {
      article_type: 'newspic',
      title: metadata.title || this.title,
      content: content,
      need_open_commnet: metadata.need_open_comment || 0,
      only_fans_can_comment: metadata.only_fans_can_comment || 0,
      image_info: {
        image_list: imageList,
      }
    }

    try {

      if (!this.wechatClient) {
        initApiClients();
        this.wechatClient = getWechatClient();
      }

      const newApiArticle = {
        title: imagesData.title,
        content: imagesData.content,
        author: '',
        digest: '',
        content_source_url: '',
        thumb_media_id: imageList.length > 0 ? imageList[0].image_media_id : '',
        show_cover_pic: true,
        need_open_comment: imagesData.need_open_commnet === 1,
        only_fans_can_comment: imagesData.only_fans_can_comment === 1
      };
      
      const response = await this.wechatClient.createDraft([newApiArticle], token);
      
      if (response.media_id) {
        return response.media_id;
      } else {
        console.error(JSON.stringify(response));
        throw new Error('发布失败!' + response.errmsg);
      }
    } catch (error) {

      throw new Error(`创建图片/文字失败: ${(error as Error).message}！`);
    }
  }

  async exportHTML() {
    await this.cachedElementsToImages();
    const lm = LocalImageManager.getInstance();
    const content = await lm.embleImages(this.articleDiv, this.app.vault);
    const globalStyle = await this.assetsManager.getStyle();
    const html = applyCSS(content, this.getCSS() + globalStyle);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.title + '.html';
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
  }

  async processCachedElements() {
    const af = this.app.workspace.getActiveFile();
    if (!af) {

      return;
    }
    for (const [key, value] of this.cachedElements) {
      const [category, id] = key.split(':');
      if (category === 'mermaid') {
        const container = this.articleDiv.querySelector('#' + id) as HTMLElement;
        if (container) {
          await MarkdownRenderer.render(this.app, value, container, af.path, this.itemView);
        }
      }
    }
  }

  async cachedElementsToImages() {
    for (const [key, cached] of this.cachedElements) {
      const [category, elementId] = key.split(':');
      const container = this.articleDiv.querySelector(`#${elementId}`) as HTMLElement;
      if (!container) continue;

      if (category === 'mermaid') {
        await this.replaceMermaidWithImage(container, elementId);
      }
    }
  }

  private async replaceMermaidWithImage(container: HTMLElement, id: string) {
    const mermaidContainer = container.querySelector('.mermaid') as HTMLElement;
    if (!mermaidContainer || !mermaidContainer.children.length) return;

    const svg = mermaidContainer.querySelector('svg');
    if (!svg) return;

    try {
      const pngDataUrl = await toPng(mermaidContainer.firstElementChild as HTMLElement, { pixelRatio: 2 });
      const img = document.createElement('img');
      img.id = `img-${id}`;
      img.src = pngDataUrl;
      const svgWidth = Math.max(0, svg.clientWidth);
      if (svgWidth > 0) {
        img.width = Math.round(svgWidth);
      }

      container.replaceChild(img, mermaidContainer);
    } catch (error) {

    }
  }

  updateElementByID(id: string, html: string): void {
    const item = this.articleDiv.querySelector('#' + id) as HTMLElement;
    if (!item) return;
    const doc = sanitizeHTMLToDom(html);
    item.empty();
    if (doc.childElementCount > 0) {
      for (const child of doc.children) {
        item.appendChild(child.cloneNode(true)); // 使用 cloneNode 复制节点以避免移动它
      }
    }
    else {
      item.innerText = '渲染失败';
    }
  }

  cacheElement(category: string, id: string, data: string): void {
    const key = category + ':' + id;
    this.cachedElements.set(key, data);
  }
}
