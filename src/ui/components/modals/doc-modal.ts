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
    modalEl.classList.add('wdwx-doc-modal');
    contentEl.classList.add('wdwx-doc-modal__container');

    const titleEl = contentEl.createEl('h2', { text: this.title });
    titleEl.classList.add('wdwx-doc-modal__title');
    const content = contentEl.createEl('div');
    content.classList.add('wdwx-doc-modal__content');
    content.appendChild(sanitizeHTMLToDom(this.content));

    const iframe = contentEl.createEl('iframe', {
      attr: {
        src: this.url,
        width: '100%',
        allow: 'clipboard-read; clipboard-write',
      },
    });

    iframe.classList.add('wdwx-doc-modal__frame');
  }

  onClose() {

    let { contentEl } = this;
    contentEl.empty();
  }
}
