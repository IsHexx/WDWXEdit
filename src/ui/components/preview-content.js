/*
 * Copyright (c) 2024-2025 IsHexx
 * All rights reserved.
 *
 * This software is proprietary and confidential. No part of this software
 * may be reproduced, distributed, or transmitted in any form or by any means,
 * including photocopying, recording, or other electronic or mechanical methods,
 * without the prior written permission of the author, except in the case of
 * brief quotations embodied in critical reviews and certain other noncommercial
 * uses permitted by copyright law.
 *
 * For permission requests, contact: IsHexx
 */
// 内容展示组件，负责文章内容的渲染和显示
/**
 * 内容展示组件 - 负责文章内容的渲染容器
 */
export class PreviewContent {
    constructor(parent) {
        this.parent = parent;
    }
    build() {
        // 创建渲染容器
        this.renderDiv = this.parent.createDiv({ cls: 'render-div' });
        this.renderDiv.id = 'render-div';
        this.renderDiv.setAttribute('style', '-webkit-user-select: text; user-select: text;');
        // 创建样式元素
        this.styleEl = this.renderDiv.createEl('style');
        this.styleEl.setAttr('title', 'wdwxedit-style');
        // 创建文章内容容器
        this.articleDiv = this.renderDiv.createEl('div');
    }
    // 获取所有内容元素
    getElements() {
        return {
            renderDiv: this.renderDiv,
            styleEl: this.styleEl,
            articleDiv: this.articleDiv
        };
    }
    // 获取渲染容器
    getRenderDiv() {
        return this.renderDiv;
    }
    // 获取样式元素
    getStyleEl() {
        return this.styleEl;
    }
    // 获取文章容器
    getArticleDiv() {
        return this.articleDiv;
    }
    // 清空内容
    clearContent() {
        if (this.articleDiv) {
            this.articleDiv.empty();
        }
    }
    // Claude Code Update: setContent使用sanitizeHTMLToDom确保安全，getContent可以保留innerHTML（用于序列化）
    // 设置内容
    setContent(html) {
        if (this.articleDiv) {
            // 使用sanitizeHTMLToDom确保HTML安全
            import('obsidian').then(({ sanitizeHTMLToDom }) => {
                const sanitized = sanitizeHTMLToDom(html);
                this.articleDiv.empty();
                if (sanitized.firstChild) {
                    this.articleDiv.appendChild(sanitized.firstChild);
                }
            });
        }
    }
    // 获取内容（保留innerHTML用于序列化输出）
    getContent() {
        var _a;
        return ((_a = this.articleDiv) === null || _a === void 0 ? void 0 : _a.innerHTML) || '';
    }
    // Claude Code Update: 使用textContent替代innerHTML设置CSS文本
    // 更新样式
    updateStyle(css) {
        if (this.styleEl) {
            this.styleEl.textContent = css;
        }
    }
    // 添加样式
    addStyle(css) {
        if (this.styleEl) {
            this.styleEl.textContent += css;
        }
    }
    // 显示加载状态
    showLoading() {
        this.clearContent();
        const loading = this.articleDiv.createDiv({ cls: 'content-loading' });
        loading.createDiv({ cls: 'loading-text' }).textContent = '正在渲染内容...';
    }
    // 显示错误状态
    showError(message) {
        this.clearContent();
        const error = this.articleDiv.createDiv({ cls: 'content-error' });
        error.createDiv({ cls: 'error-title' }).textContent = '渲染出错';
        error.createDiv({ cls: 'error-message' }).textContent = message;
    }
    // 显示空状态
    showEmpty() {
        this.clearContent();
        const empty = this.articleDiv.createDiv({ cls: 'content-empty' });
        empty.createDiv({ cls: 'empty-title' }).textContent = '没有内容';
        empty.createDiv({ cls: 'empty-message' }).textContent = '请选择一个Markdown文件进行预览';
    }
    // 滚动到顶部
    scrollToTop() {
        if (this.renderDiv) {
            this.renderDiv.scrollTop = 0;
        }
    }
    // 滚动到底部
    scrollToBottom() {
        if (this.renderDiv) {
            this.renderDiv.scrollTop = this.renderDiv.scrollHeight;
        }
    }
    // 获取滚动位置
    getScrollPosition() {
        var _a;
        return ((_a = this.renderDiv) === null || _a === void 0 ? void 0 : _a.scrollTop) || 0;
    }
    // 设置滚动位置
    setScrollPosition(position) {
        if (this.renderDiv) {
            this.renderDiv.scrollTop = position;
        }
    }
    // 添加CSS类
    addClass(className) {
        if (this.renderDiv) {
            this.renderDiv.addClass(className);
        }
    }
    // 移除CSS类
    removeClass(className) {
        if (this.renderDiv) {
            this.renderDiv.removeClass(className);
        }
    }
    // 检查是否有指定CSS类
    hasClass(className) {
        var _a;
        return ((_a = this.renderDiv) === null || _a === void 0 ? void 0 : _a.hasClass(className)) || false;
    }
    // Claude Code Update: 使用CSS类而非内联样式
    // 设置可见性
    setVisible(visible) {
        if (this.renderDiv) {
            if (visible) {
                this.renderDiv.removeClass('hidden');
            }
            else {
                this.renderDiv.addClass('hidden');
            }
        }
    }
    // 检查是否可见
    isVisible() {
        return this.renderDiv ? !this.renderDiv.hasClass('hidden') : false;
    }
    // 获取内容高度
    getContentHeight() {
        var _a;
        return ((_a = this.renderDiv) === null || _a === void 0 ? void 0 : _a.scrollHeight) || 0;
    }
    // 获取可视高度
    getVisibleHeight() {
        var _a;
        return ((_a = this.renderDiv) === null || _a === void 0 ? void 0 : _a.clientHeight) || 0;
    }
    // 检查是否可以滚动
    isScrollable() {
        return this.getContentHeight() > this.getVisibleHeight();
    }
    // 添加事件监听器
    addEventListener(event, handler) {
        if (this.renderDiv) {
            this.renderDiv.addEventListener(event, handler);
        }
    }
    // 移除事件监听器
    removeEventListener(event, handler) {
        if (this.renderDiv) {
            this.renderDiv.removeEventListener(event, handler);
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJldmlldy1jb250ZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicHJldmlldy1jb250ZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7R0FZRztBQUVILHNCQUFzQjtBQUN0Qjs7R0FFRztBQUNILE1BQU0sT0FBTyxjQUFjO0lBTXZCLFlBQVksTUFBc0I7UUFDOUIsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7SUFDekIsQ0FBQztJQUVELEtBQUs7UUFDRCxTQUFTO1FBQ1QsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxZQUFZLEVBQUUsQ0FBQyxDQUFDO1FBQzlELElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxHQUFHLFlBQVksQ0FBQztRQUNqQyxJQUFJLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsK0NBQStDLENBQUMsQ0FBQztRQUV0RixTQUFTO1FBQ1QsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNoRCxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztRQUVoRCxXQUFXO1FBQ1gsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNyRCxDQUFDO0lBRUQsV0FBVztJQUNYLFdBQVc7UUFDUCxPQUFPO1lBQ0gsU0FBUyxFQUFFLElBQUksQ0FBQyxTQUFTO1lBQ3pCLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTztZQUNyQixVQUFVLEVBQUUsSUFBSSxDQUFDLFVBQVU7U0FDOUIsQ0FBQztJQUNOLENBQUM7SUFFRCxTQUFTO0lBQ1QsWUFBWTtRQUNSLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQztJQUMxQixDQUFD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LEVBQUUsT0FBTyxDQUFDLENBQUM7U0FDdEQ7SUFDTCxDQUFDO0NBQ0oiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IChjKSAyMDI0LTIwMjUgSXNIZXh4XG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc29mdHdhcmUgaXMgcHJvcHJpZXRhcnkgYW5kIGNvbmZpZGVudGlhbC4gTm8gcGFydCBvZiB0aGlzIHNvZnR3YXJlXG4gKiBtYXkgYmUgcmVwcm9kdWNlZCwgZGlzdHJpYnV0ZWQsIG9yIHRyYW5zbWl0dGVkIGluIGFueSBmb3JtIG9yIGJ5IGFueSBtZWFucyxcbiAqIGluY2x1ZGluZyBwaG90b2NvcHlpbmcsIHJlY29yZGluZywgb3Igb3RoZXIgZWxlY3Ryb25pYyBvciBtZWNoYW5pY2FsIG1ldGhvZHMsXG4gKiB3aXRob3V0IHRoZSBwcmlvciB3cml0dGVuIHBlcm1pc3Npb24gb2YgdGhlIGF1dGhvciwgZXhjZXB0IGluIHRoZSBjYXNlIG9mXG4gKiBicmllZiBxdW90YXRpb25zIGVtYm9kaWVkIGluIGNyaXRpY2FsIHJldmlld3MgYW5kIGNlcnRhaW4gb3RoZXIgbm9uY29tbWVyY2lhbFxuICogdXNlcyBwZXJtaXR0ZWQgYnkgY29weXJpZ2h0IGxhdy5cbiAqXG4gKiBGb3IgcGVybWlzc2lvbiByZXF1ZXN0cywgY29udGFjdDogSXNIZXh4XG4gKi9cblxuLy8g5YaF5a655bGV56S657uE5Lu277yM6LSf6LSj5paH56ug5YaF5a6555qE5riy5p+T5ZKM5pi+56S6XG4vKipcbiAqIOWGheWuueWxleekuue7hOS7tiAtIOi0n+i0o+aWh+eroOWGheWuueeahOa4suafk+WuueWZqFxuICovXG5leHBvcnQgY2xhc3MgUHJldmlld0NvbnRlbnQge1xuICAgIHByaXZhdGUgcGFyZW50OiBIVE1MRGl2RWxlbWVudDtcbiAgICBwcml2YXRlIHJlbmRlckRpdjogSFRNTERpdkVsZW1lbnQ7XG4gICAgcHJpdmF0ZSBzdHlsZUVsOiBIVE1MRWxlbWVudDtcbiAgICBwcml2YXRlIGFydGljbGVEaXY6IEhUTUxEaXZFbGVtZW50O1xuXG4gICAgY29uc3RydWN0b3IocGFyZW50OiBIVE1MRGl2RWxlbWVudCkge1xuICAgICAgICB0aGlzLnBhcmVudCA9IHBhcmVudDtcbiAgICB9XG5cbiAgICBidWlsZCgpIHtcbiAgICAgICAgLy8g5Yib5bu65riy5p+T5a655ZmoXG4gICAgICAgIHRoaXMucmVuZGVyRGl2ID0gdGhpcy5wYXJlbnQuY3JlYXRlRGl2KHsgY2xzOiAncmVuZGVyLWRpdicgfSk7XG4gICAgICAgIHRoaXMucmVuZGVyRGl2LmlkID0gJ3JlbmRlci1kaXYnO1xuICAgICAgICB0aGlzLnJlbmRlckRpdi5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgJy13ZWJraXQtdXNlci1zZWxlY3Q6IHRleHQ7IHVzZXItc2VsZWN0OiB0ZXh0OycpO1xuXG4gICAgICAgIC8vIOWIm+W7uuagt+W8j+WFg+e0oFxuICAgICAgICB0aGlzLnN0eWxlRWwgPSB0aGlzLnJlbmRlckRpdi5jcmVhdGVFbCgnc3R5bGUnKTtcbiAgICAgICAgdGhpcy5zdHlsZUVsLnNldEF0dHIoJ3RpdGxlJywgJ3dkd3hlZGl0LXN0eWxlJyk7XG5cbiAgICAgICAgLy8g5Yib5bu65paH56ug5YaF5a655a655ZmoXG4gICAgICAgIHRoaXMuYXJ0aWNsZURpdiA9IHRoaXMucmVuZGVyRGl2LmNyZWF0ZUVsKCdkaXYnKTtcbiAgICB9XG5cbiAgICAvLyDojrflj5bmiYDmnInlhoXlrrnlhYPntKBcbiAgICBnZXRFbGVtZW50cygpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlbmRlckRpdjogdGhpcy5yZW5kZXJEaXYsXG4gICAgICAgICAgICBzdHlsZUVsOiB0aGlzLnN0eWxlRWwsXG4gICAgICAgICAgICBhcnRpY2xlRGl2OiB0aGlzLmFydGljbGVEaXZcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyDojrflj5bmuLLmn5PlrrnlmahcbiAgICBnZXRSZW5kZXJEaXYoKTogSFRNTERpdkVsZW1lbnQge1xuICAgICAgICByZXR1cm4gdGhpcy5yZW5kZXJEaXY7XG4gICAgfVxuXG4gICAgLy8g6I635Y+W5qC35byP5YWD57SgXG4gICAgZ2V0U3R5bGVFbCgpOiBIVE1MRWxlbWVudCB7XG4gICAgICAgIHJldHVybiB0aGlzLnN0eWxlRWw7XG4gICAgfVxuXG4gICAgLy8g6I635Y+W5paH56ug5a655ZmoXG4gICAgZ2V0QXJ0aWNsZURpdigpOiBIVE1MRGl2RWxlbWVudCB7XG4gICAgICAgIHJldHVybiB0aGlzLmFydGljbGVEaXY7XG4gICAgfVxuXG4gICAgLy8g5riF56m65YaF5a65XG4gICAgY2xlYXJDb250ZW50KCkge1xuICAgICAgICBpZiAodGhpcy5hcnRpY2xlRGl2KSB7XG4gICAgICAgICAgICB0aGlzLmFydGljbGVEaXYuZW1wdHkoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIENsYXVkZSBDb2RlIFVwZGF0ZTogc2V0Q29udGVudOS9v+eUqHNhbml0aXplSFRNTFRvRG9t56Gu5L+d5a6J5YWo77yMZ2V0Q29udGVudOWPr+S7peS/neeVmWlubmVySFRNTO+8iOeUqOS6juW6j+WIl+WMlu+8iVxuICAgIC8vIOiuvue9ruWGheWuuVxuICAgIHNldENvbnRlbnQoaHRtbDogc3RyaW5nKSB7XG4gICAgICAgIGlmICh0aGlzLmFydGljbGVEaXYpIHtcbiAgICAgICAgICAgIC8vIOS9v+eUqHNhbml0aXplSFRNTFRvRG9t56Gu5L+dSFRNTOWuieWFqFxuICAgICAgICAgICAgaW1wb3J0KCdvYnNpZGlhbicpLnRoZW4oKHsgc2FuaXRpemVIVE1MVG9Eb20gfSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHNhbml0aXplZCA9IHNhbml0aXplSFRNTFRvRG9tKGh0bWwpO1xuICAgICAgICAgICAgICAgIHRoaXMuYXJ0aWNsZURpdi5lbXB0eSgpO1xuICAgICAgICAgICAgICAgIGlmIChzYW5pdGl6ZWQuZmlyc3RDaGlsZCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFydGljbGVEaXYuYXBwZW5kQ2hpbGQoc2FuaXRpemVkLmZpcnN0Q2hpbGQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8g6I635Y+W5YaF5a6577yI5L+d55WZaW5uZXJIVE1M55So5LqO5bqP5YiX5YyW6L6T5Ye677yJXG4gICAgZ2V0Q29udGVudCgpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gdGhpcy5hcnRpY2xlRGl2Py5pbm5lckhUTUwgfHwgJyc7XG4gICAgfVxuXG4gICAgLy8gQ2xhdWRlIENvZGUgVXBkYXRlOiDkvb/nlKh0ZXh0Q29udGVudOabv+S7o2lubmVySFRNTOiuvue9rkNTU+aWh+acrFxuICAgIC8vIOabtOaWsOagt+W8j1xuICAgIHVwZGF0ZVN0eWxlKGNzczogc3RyaW5nKSB7XG4gICAgICAgIGlmICh0aGlzLnN0eWxlRWwpIHtcbiAgICAgICAgICAgIHRoaXMuc3R5bGVFbC50ZXh0Q29udGVudCA9IGNzcztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIOa3u+WKoOagt+W8j1xuICAgIGFkZFN0eWxlKGNzczogc3RyaW5nKSB7XG4gICAgICAgIGlmICh0aGlzLnN0eWxlRWwpIHtcbiAgICAgICAgICAgIHRoaXMuc3R5bGVFbC50ZXh0Q29udGVudCArPSBjc3M7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyDmmL7npLrliqDovb3nirbmgIFcbiAgICBzaG93TG9hZGluZygpIHtcbiAgICAgICAgdGhpcy5jbGVhckNvbnRlbnQoKTtcbiAgICAgICAgY29uc3QgbG9hZGluZyA9IHRoaXMuYXJ0aWNsZURpdi5jcmVhdGVEaXYoeyBjbHM6ICdjb250ZW50LWxvYWRpbmcnIH0pO1xuICAgICAgICBsb2FkaW5nLmNyZWF0ZURpdih7IGNsczogJ2xvYWRpbmctdGV4dCcgfSkudGV4dENvbnRlbnQgPSAn5q2j5Zyo5riy5p+T5YaF5a65Li4uJztcbiAgICB9XG5cbiAgICAvLyDmmL7npLrplJnor6/nirbmgIFcbiAgICBzaG93RXJyb3IobWVzc2FnZTogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMuY2xlYXJDb250ZW50KCk7XG4gICAgICAgIGNvbnN0IGVycm9yID0gdGhpcy5hcnRpY2xlRGl2LmNyZWF0ZURpdih7IGNsczogJ2NvbnRlbnQtZXJyb3InIH0pO1xuICAgICAgICBlcnJvci5jcmVhdGVEaXYoeyBjbHM6ICdlcnJvci10aXRsZScgfSkudGV4dENvbnRlbnQgPSAn5riy5p+T5Ye66ZSZJztcbiAgICAgICAgZXJyb3IuY3JlYXRlRGl2KHsgY2xzOiAnZXJyb3ItbWVzc2FnZScgfSkudGV4dENvbnRlbnQgPSBtZXNzYWdlO1xuICAgIH1cblxuICAgIC8vIOaYvuekuuepuueKtuaAgVxuICAgIHNob3dFbXB0eSgpIHtcbiAgICAgICAgdGhpcy5jbGVhckNvbnRlbnQoKTtcbiAgICAgICAgY29uc3QgZW1wdHkgPSB0aGlzLmFydGljbGVEaXYuY3JlYXRlRGl2KHsgY2xzOiAnY29udGVudC1lbXB0eScgfSk7XG4gICAgICAgIGVtcHR5LmNyZWF0ZURpdih7IGNsczogJ2VtcHR5LXRpdGxlJyB9KS50ZXh0Q29udGVudCA9ICfmsqHmnInlhoXlrrknO1xuICAgICAgICBlbXB0eS5jcmVhdGVEaXYoeyBjbHM6ICdlbXB0eS1tZXNzYWdlJyB9KS50ZXh0Q29udGVudCA9ICfor7fpgInmi6nkuIDkuKpNYXJrZG93buaWh+S7tui/m+ihjOmihOiniCc7XG4gICAgfVxuXG4gICAgLy8g5rua5Yqo5Yiw6aG26YOoXG4gICAgc2Nyb2xsVG9Ub3AoKSB7XG4gICAgICAgIGlmICh0aGlzLnJlbmRlckRpdikge1xuICAgICAgICAgICAgdGhpcy5yZW5kZXJEaXYuc2Nyb2xsVG9wID0gMDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIOa7muWKqOWIsOW6lemDqFxuICAgIHNjcm9sbFRvQm90dG9tKCkge1xuICAgICAgICBpZiAodGhpcy5yZW5kZXJEaXYpIHtcbiAgICAgICAgICAgIHRoaXMucmVuZGVyRGl2LnNjcm9sbFRvcCA9IHRoaXMucmVuZGVyRGl2LnNjcm9sbEhlaWdodDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIOiOt+WPlua7muWKqOS9jee9rlxuICAgIGdldFNjcm9sbFBvc2l0aW9uKCk6IG51bWJlciB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlbmRlckRpdj8uc2Nyb2xsVG9wIHx8IDA7XG4gICAgfVxuXG4gICAgLy8g6K6+572u5rua5Yqo5L2N572uXG4gICAgc2V0U2Nyb2xsUG9zaXRpb24ocG9zaXRpb246IG51bWJlcikge1xuICAgICAgICBpZiAodGhpcy5yZW5kZXJEaXYpIHtcbiAgICAgICAgICAgIHRoaXMucmVuZGVyRGl2LnNjcm9sbFRvcCA9IHBvc2l0aW9uO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8g5re75YqgQ1NT57G7XG4gICAgYWRkQ2xhc3MoY2xhc3NOYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKHRoaXMucmVuZGVyRGl2KSB7XG4gICAgICAgICAgICB0aGlzLnJlbmRlckRpdi5hZGRDbGFzcyhjbGFzc05hbWUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8g56e76ZmkQ1NT57G7XG4gICAgcmVtb3ZlQ2xhc3MoY2xhc3NOYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKHRoaXMucmVuZGVyRGl2KSB7XG4gICAgICAgICAgICB0aGlzLnJlbmRlckRpdi5yZW1vdmVDbGFzcyhjbGFzc05hbWUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8g5qOA5p+l5piv5ZCm5pyJ5oyH5a6aQ1NT57G7XG4gICAgaGFzQ2xhc3MoY2xhc3NOYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVuZGVyRGl2Py5oYXNDbGFzcyhjbGFzc05hbWUpIHx8IGZhbHNlO1xuICAgIH1cblxuICAgIC8vIENsYXVkZSBDb2RlIFVwZGF0ZTog5L2/55SoQ1NT57G76ICM6Z2e5YaF6IGU5qC35byPXG4gICAgLy8g6K6+572u5Y+v6KeB5oCnXG4gICAgc2V0VmlzaWJsZSh2aXNpYmxlOiBib29sZWFuKSB7XG4gICAgICAgIGlmICh0aGlzLnJlbmRlckRpdikge1xuICAgICAgICAgICAgaWYgKHZpc2libGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbmRlckRpdi5yZW1vdmVDbGFzcygnaGlkZGVuJyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyRGl2LmFkZENsYXNzKCdoaWRkZW4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIOajgOafpeaYr+WQpuWPr+ingVxuICAgIGlzVmlzaWJsZSgpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVuZGVyRGl2ID8gIXRoaXMucmVuZGVyRGl2Lmhhc0NsYXNzKCdoaWRkZW4nKSA6IGZhbHNlO1xuICAgIH1cblxuICAgIC8vIOiOt+WPluWGheWuuemrmOW6plxuICAgIGdldENvbnRlbnRIZWlnaHQoKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVuZGVyRGl2Py5zY3JvbGxIZWlnaHQgfHwgMDtcbiAgICB9XG5cbiAgICAvLyDojrflj5blj6/op4bpq5jluqZcbiAgICBnZXRWaXNpYmxlSGVpZ2h0KCk6IG51bWJlciB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlbmRlckRpdj8uY2xpZW50SGVpZ2h0IHx8IDA7XG4gICAgfVxuXG4gICAgLy8g5qOA5p+l5piv5ZCm5Y+v5Lul5rua5YqoXG4gICAgaXNTY3JvbGxhYmxlKCk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRDb250ZW50SGVpZ2h0KCkgPiB0aGlzLmdldFZpc2libGVIZWlnaHQoKTtcbiAgICB9XG5cbiAgICAvLyDmt7vliqDkuovku7bnm5HlkKzlmahcbiAgICBhZGRFdmVudExpc3RlbmVyKGV2ZW50OiBzdHJpbmcsIGhhbmRsZXI6IEV2ZW50TGlzdGVuZXIpIHtcbiAgICAgICAgaWYgKHRoaXMucmVuZGVyRGl2KSB7XG4gICAgICAgICAgICB0aGlzLnJlbmRlckRpdi5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBoYW5kbGVyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIOenu+mZpOS6i+S7tuebkeWQrOWZqFxuICAgIHJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnQ6IHN0cmluZywgaGFuZGxlcjogRXZlbnRMaXN0ZW5lcikge1xuICAgICAgICBpZiAodGhpcy5yZW5kZXJEaXYpIHtcbiAgICAgICAgICAgIHRoaXMucmVuZGVyRGl2LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnQsIGhhbmRsZXIpO1xuICAgICAgICB9XG4gICAgfVxufSJdfQ==