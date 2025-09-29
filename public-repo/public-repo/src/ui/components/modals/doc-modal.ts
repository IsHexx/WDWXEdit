import { App, Modal, sanitizeHTMLToDom } from "obsidian";

export class DocModal extends Modal {
  url: string = '';
  title: string = '提示';
  content: string = '';

  constructor(app: App, title: string = "提示", content: string = "", url: string = "") {
    super(app);
    this.title = title;
    this.content = content;
    this.url = url;
  }

  onOpen() {
    let { contentEl, modalEl } = this;
    modalEl.style.width = '640px';
    modalEl.style.height = '720px';
    contentEl.style.display = 'flex';
    contentEl.style.flexDirection = 'column';

    const titleEl = contentEl.createEl('h2', { text: this.title });
    titleEl.style.marginTop = '0.5em';
    const content = contentEl.createEl('div');
    content.setAttr('style', 'margin-bottom:1em;-webkit-user-select: text; user-select: text;');
    content.appendChild(sanitizeHTMLToDom(this.content));

    const iframe = contentEl.createEl('iframe', {
      attr: {
        src: this.url,
        width: '100%',
        allow: 'clipboard-read; clipboard-write',
      },
    });

    iframe.style.flex = '1';
  }

  onClose() {

    let { contentEl } = this;
    contentEl.empty();
  }
}