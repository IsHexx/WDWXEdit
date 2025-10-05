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
// 状态栏组件，负责显示操作状态和消息
/**
 * 状态栏组件 - 负责显示操作状态、进度信息和用户反馈
 */
export class PreviewStatus {
    constructor(parent) {
        this.parent = parent;
        this.build();
    }
    // Claude Code Update: 使用CSS类而非内联样式
    build() {
        // 创建状态栏容器
        this.statusContainer = this.parent.createDiv({ cls: 'preview-status hidden' });
        // 创建状态图标
        this.statusIcon = this.statusContainer.createDiv({ cls: 'status-icon' });
        // 创建状态消息
        this.statusMessage = this.statusContainer.createDiv({ cls: 'status-message' });
        // 创建进度条
        this.progressBar = this.statusContainer.createDiv({ cls: 'status-progress' });
    }
    // 显示信息状态
    showInfo(message, duration) {
        this.showStatus(message, 'info', duration);
    }
    // 显示成功状态
    showSuccess(message, duration) {
        this.showStatus(message, 'success', duration || 3000);
    }
    // 显示警告状态
    showWarning(message, duration) {
        this.showStatus(message, 'warning', duration || 5000);
    }
    // 显示错误状态
    showError(message, duration) {
        this.showStatus(message, 'error', duration || 5000);
    }
    // 显示加载状态
    showLoading(message) {
        this.showStatus(message, 'loading');
        this.showProgress(true);
    }
    // 显示上传状态
    showUploading(message, duration) {
        this.showStatus(message, 'upload', duration);
        this.showProgress(true);
    }
    // 显示复制状态
    showCopying(message, duration) {
        this.showStatus(message, 'copy', duration);
    }
    // 显示处理状态
    showProcessing(message, duration) {
        this.showStatus(message, 'processing', duration);
        this.showProgress(true);
    }
    // 显示状态
    showStatus(message, type, duration) {
        // 清除之前的超时
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = undefined;
        }
        // 设置消息
        this.statusMessage.textContent = message;
        // 设置图标
        this.updateIcon(type);
        // Claude Code Update: 使用CSS类而非内联样式
        // 设置样式
        this.statusContainer.className = `preview-status status-${type}`;
        this.statusContainer.removeClass('hidden');
        // 根据类型显示/隐藏进度条，避免首次显示出现进度条与高度异常
        const showProgress = type === 'loading' || type === 'upload' || type === 'processing';
        this.showProgress(showProgress);
        // 如果不是加载/上传/处理状态且设置了持续时间，自动隐藏
        if (!showProgress && duration) {
            this.hideTimeout = setTimeout(() => {
                this.hideMessage();
            }, duration);
        }
    }
    // Claude Code Update: 使用DOM API替代innerHTML设置SVG内容
    // 更新图标
    updateIcon(type) {
        let iconSvg = '';
        switch (type) {
            case 'info':
                iconSvg = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="16" x2="12" y2="12"/>
                        <line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                `;
                break;
            case 'success':
                iconSvg = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22,4 12,14.01 9,11.01"/>
                    </svg>
                `;
                break;
            case 'warning':
                iconSvg = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                `;
                break;
            case 'error':
                iconSvg = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                `;
                break;
            case 'loading':
                iconSvg = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="loading-spinner">
                        <path d="M21 12a9 9 0 11-6.219-8.56"/>
                    </svg>
                `;
                break;
            case 'upload':
                iconSvg = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                        <polyline points="7,10 12,15 17,10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                `;
                break;
            case 'copy':
                iconSvg = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                    </svg>
                `;
                break;
            case 'processing':
                iconSvg = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="processing-icon">
                        <path d="M12 2v6"/>
                        <path d="M12 18v4"/>
                        <path d="M4.93 4.93l4.24 4.24"/>
                        <path d="M14.83 14.83l4.24 4.24"/>
                        <path d="M2 12h6"/>
                        <path d="M18 12h4"/>
                        <path d="M4.93 19.07l4.24-4.24"/>
                        <path d="M14.83 9.17l4.24-4.24"/>
                    </svg>
                `;
                break;
        }
        this.statusIcon.empty();
        this.statusIcon.appendChild(document.createRange().createContextualFragment(iconSvg));
    }
    // Claude Code Update: 使用DOM API替代innerHTML
    // 显示/隐藏进度条
    showProgress(show) {
        if (show) {
            this.progressBar.removeClass('hidden');
            // 添加进度动画
            this.progressBar.empty();
            this.progressBar.createDiv({ cls: 'progress-bar-fill' });
        }
        else {
            this.progressBar.addClass('hidden');
        }
    }
    // 更新进度
    updateProgress(percent) {
        const progressFill = this.progressBar.querySelector('.progress-bar-fill');
        if (progressFill) {
            // 进度条宽度需要动态计算，保留内联样式
            progressFill.style.width = `${Math.min(100, Math.max(0, percent))}%`;
        }
    }
    // Claude Code Update: 使用CSS类而非内联样式
    // 隐藏消息
    hideMessage() {
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = undefined;
        }
        this.statusContainer.addClass('hidden');
        this.showProgress(false);
    }
    // 检查是否可见
    isVisible() {
        return !this.statusContainer.hasClass('hidden');
    }
    // 获取当前消息
    getCurrentMessage() {
        return this.statusMessage.textContent || '';
    }
    // 获取当前状态类型
    getCurrentType() {
        const className = this.statusContainer.className;
        const match = className.match(/status-(\w+)/);
        return match ? match[1] : '';
    }
    // 设置点击处理器
    setClickHandler(handler) {
        this.statusContainer.onclick = handler;
        this.statusContainer.style.cursor = 'pointer';
    }
    // 移除点击处理器
    removeClickHandler() {
        this.statusContainer.onclick = null;
        this.statusContainer.style.cursor = 'default';
    }
    // Claude Code Update: 使用DOM API替代innerHTML设置SVG内容
    // 添加关闭按钮
    addCloseButton() {
        const closeBtn = this.statusContainer.createDiv({ cls: 'status-close' });
        const closeSvg = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
        `;
        closeBtn.appendChild(document.createRange().createContextualFragment(closeSvg));
        closeBtn.onclick = (e) => {
            e.stopPropagation();
            this.hideMessage();
        };
    }
    // 移除关闭按钮
    removeCloseButton() {
        const closeBtn = this.statusContainer.querySelector('.status-close');
        if (closeBtn) {
            closeBtn.remove();
        }
    }
    // 设置位置
    setPosition(position) {
        this.statusContainer.removeClass('status-top');
        this.statusContainer.removeClass('status-bottom');
        this.statusContainer.removeClass('status-center');
        this.statusContainer.addClass(`status-${position}`);
    }
    // 获取状态容器元素
    getElement() {
        return this.statusContainer;
    }
    // 销毁组件
    destroy() {
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
        }
        this.statusContainer.remove();
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJldmlldy1zdGF0dXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJwcmV2aWV3LXN0YXR1cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7O0dBWUc7QUFFSCxvQkFBb0I7QUFDcEI7O0dBRUc7QUFDSCxNQUFNLE9BQU8sYUFBYTtJQVF0QixZQUFZLE1BQXNCO1FBQzlCLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUNqQixDQUFDO0lBRUQsbUNBQW1DO0lBQzNCLEtBQUs7UUFDVCxVQUFVO1FBQ1YsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEdBQUcsRUFBRSx1QkFBdUIsRUFBRSxDQUFDLENBQUM7UUFFL0UsU0FBUztRQUNULElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsRUFBRSxHQUFHLEVBQUUsYUFBYSxFQUFFLENBQUMsQ0FBQztRQUV6RSxTQUFTO1FBQ1QsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxnQkFBZ0IsRUFBRSxDQUFDLENBQUM7UUFFL0UsUUFBUTtRQUNSLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsRUFBRSxHQUFHLEVBQUUsaUJBQWlCLEVBQUUsQ0FBQyxDQUFDO0lBQ2xGLENBQUM7SUFFRCxTQUFTO0lBQ1QsUUFBUSxDQUFDLE9BQWUsRUFBRSxRQUFpQjtRQUN2QyxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDL0MsQ0FBQztJQUVELFNBQVM7SUFDVCxXQUFXLENBQUMsT0FBZSxFQUFFLFFBQWlCO1FBQzFDLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxF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QUFJLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxVQUFVLFFBQVEsRUFBRSxDQUFDLENBQUM7SUFDeEQsQ0FBQztJQUVELFdBQVc7SUFDWCxVQUFVO1FBQ04sT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDO0lBQ2hDLENBQUM7SUFFRCxPQUFPO0lBQ1AsT0FBTztRQUNILElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRTtZQUNsQixZQUFZLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1NBQ2xDO1FBQ0QsSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUNsQyxDQUFDO0NBQ0oiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IChjKSAyMDI0LTIwMjUgSXNIZXh4XG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc29mdHdhcmUgaXMgcHJvcHJpZXRhcnkgYW5kIGNvbmZpZGVudGlhbC4gTm8gcGFydCBvZiB0aGlzIHNvZnR3YXJlXG4gKiBtYXkgYmUgcmVwcm9kdWNlZCwgZGlzdHJpYnV0ZWQsIG9yIHRyYW5zbWl0dGVkIGluIGFueSBmb3JtIG9yIGJ5IGFueSBtZWFucyxcbiAqIGluY2x1ZGluZyBwaG90b2NvcHlpbmcsIHJlY29yZGluZywgb3Igb3RoZXIgZWxlY3Ryb25pYyBvciBtZWNoYW5pY2FsIG1ldGhvZHMsXG4gKiB3aXRob3V0IHRoZSBwcmlvciB3cml0dGVuIHBlcm1pc3Npb24gb2YgdGhlIGF1dGhvciwgZXhjZXB0IGluIHRoZSBjYXNlIG9mXG4gKiBicmllZiBxdW90YXRpb25zIGVtYm9kaWVkIGluIGNyaXRpY2FsIHJldmlld3MgYW5kIGNlcnRhaW4gb3RoZXIgbm9uY29tbWVyY2lhbFxuICogdXNlcyBwZXJtaXR0ZWQgYnkgY29weXJpZ2h0IGxhdy5cbiAqXG4gKiBGb3IgcGVybWlzc2lvbiByZXF1ZXN0cywgY29udGFjdDogSXNIZXh4XG4gKi9cblxuLy8g54q25oCB5qCP57uE5Lu277yM6LSf6LSj5pi+56S65pON5L2c54q25oCB5ZKM5raI5oGvXG4vKipcbiAqIOeKtuaAgeagj+e7hOS7tiAtIOi0n+i0o+aYvuekuuaTjeS9nOeKtuaAgeOAgei/m+W6puS/oeaBr+WSjOeUqOaIt+WPjemmiFxuICovXG5leHBvcnQgY2xhc3MgUHJldmlld1N0YXR1cyB7XG4gICAgcHJpdmF0ZSBwYXJlbnQ6IEhUTUxEaXZFbGVtZW50O1xuICAgIHByaXZhdGUgc3RhdHVzQ29udGFpbmVyOiBIVE1MRGl2RWxlbWVudDtcbiAgICBwcml2YXRlIHN0YXR1c01lc3NhZ2U6IEhUTUxEaXZFbGVtZW50O1xuICAgIHByaXZhdGUgc3RhdHVzSWNvbjogSFRNTERpdkVsZW1lbnQ7XG4gICAgcHJpdmF0ZSBwcm9ncmVzc0JhcjogSFRNTERpdkVsZW1lbnQ7XG4gICAgcHJpdmF0ZSBoaWRlVGltZW91dD86IE5vZGVKUy5UaW1lb3V0O1xuXG4gICAgY29uc3RydWN0b3IocGFyZW50OiBIVE1MRGl2RWxlbWVudCkge1xuICAgICAgICB0aGlzLnBhcmVudCA9IHBhcmVudDtcbiAgICAgICAgdGhpcy5idWlsZCgpO1xuICAgIH1cblxuICAgIC8vIENsYXVkZSBDb2RlIFVwZGF0ZTog5L2/55SoQ1NT57G76ICM6Z2e5YaF6IGU5qC35byPXG4gICAgcHJpdmF0ZSBidWlsZCgpIHtcbiAgICAgICAgLy8g5Yib5bu654q25oCB5qCP5a655ZmoXG4gICAgICAgIHRoaXMuc3RhdHVzQ29udGFpbmVyID0gdGhpcy5wYXJlbnQuY3JlYXRlRGl2KHsgY2xzOiAncHJldmlldy1zdGF0dXMgaGlkZGVuJyB9KTtcblxuICAgICAgICAvLyDliJvlu7rnirbmgIHlm77moIdcbiAgICAgICAgdGhpcy5zdGF0dXNJY29uID0gdGhpcy5zdGF0dXNDb250YWluZXIuY3JlYXRlRGl2KHsgY2xzOiAnc3RhdHVzLWljb24nIH0pO1xuXG4gICAgICAgIC8vIOWIm+W7uueKtuaAgea2iOaBr1xuICAgICAgICB0aGlzLnN0YXR1c01lc3NhZ2UgPSB0aGlzLnN0YXR1c0NvbnRhaW5lci5jcmVhdGVEaXYoeyBjbHM6ICdzdGF0dXMtbWVzc2FnZScgfSk7XG5cbiAgICAgICAgLy8g5Yib5bu66L+b5bqm5p2hXG4gICAgICAgIHRoaXMucHJvZ3Jlc3NCYXIgPSB0aGlzLnN0YXR1c0NvbnRhaW5lci5jcmVhdGVEaXYoeyBjbHM6ICdzdGF0dXMtcHJvZ3Jlc3MnIH0pO1xuICAgIH1cblxuICAgIC8vIOaYvuekuuS/oeaBr+eKtuaAgVxuICAgIHNob3dJbmZvKG1lc3NhZ2U6IHN0cmluZywgZHVyYXRpb24/OiBudW1iZXIpIHtcbiAgICAgICAgdGhpcy5zaG93U3RhdHVzKG1lc3NhZ2UsICdpbmZvJywgZHVyYXRpb24pO1xuICAgIH1cblxuICAgIC8vIOaYvuekuuaIkOWKn+eKtuaAgVxuICAgIHNob3dTdWNjZXNzKG1lc3NhZ2U6IHN0cmluZywgZHVyYXRpb24/OiBudW1iZXIpIHtcbiAgICAgICAgdGhpcy5zaG93U3RhdHVzKG1lc3NhZ2UsICdzdWNjZXNzJywgZHVyYXRpb24gfHwgMzAwMCk7XG4gICAgfVxuXG4gICAgLy8g5pi+56S66K2m5ZGK54q25oCBXG4gICAgc2hvd1dhcm5pbmcobWVzc2FnZTogc3RyaW5nLCBkdXJhdGlvbj86IG51bWJlcikge1xuICAgICAgICB0aGlzLnNob3dTdGF0dXMobWVzc2FnZSwgJ3dhcm5pbmcnLCBkdXJhdGlvbiB8fCA1MDAwKTtcbiAgICB9XG5cbiAgICAvLyDmmL7npLrplJnor6/nirbmgIFcbiAgICBzaG93RXJyb3IobWVzc2FnZTogc3RyaW5nLCBkdXJhdGlvbj86IG51bWJlcikge1xuICAgICAgICB0aGlzLnNob3dTdGF0dXMobWVzc2FnZSwgJ2Vycm9yJywgZHVyYXRpb24gfHwgNTAwMCk7XG4gICAgfVxuXG4gICAgLy8g5pi+56S65Yqg6L2954q25oCBXG4gICAgc2hvd0xvYWRpbmcobWVzc2FnZTogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMuc2hvd1N0YXR1cyhtZXNzYWdlLCAnbG9hZGluZycpO1xuICAgICAgICB0aGlzLnNob3dQcm9ncmVzcyh0cnVlKTtcbiAgICB9XG5cbiAgICAvLyDmmL7npLrkuIrkvKDnirbmgIFcbiAgICBzaG93VXBsb2FkaW5nKG1lc3NhZ2U6IHN0cmluZywgZHVyYXRpb24/OiBudW1iZXIpIHtcbiAgICAgICAgdGhpcy5zaG93U3RhdHVzKG1lc3NhZ2UsICd1cGxvYWQnLCBkdXJhdGlvbik7XG4gICAgICAgIHRoaXMuc2hvd1Byb2dyZXNzKHRydWUpO1xuICAgIH1cblxuICAgIC8vIOaYvuekuuWkjeWItueKtuaAgVxuICAgIHNob3dDb3B5aW5nKG1lc3NhZ2U6IHN0cmluZywgZHVyYXRpb24/OiBudW1iZXIpIHtcbiAgICAgICAgdGhpcy5zaG93U3RhdHVzKG1lc3NhZ2UsICdjb3B5JywgZHVyYXRpb24pO1xuICAgIH1cblxuICAgIC8vIOaYvuekuuWkhOeQhueKtuaAgVxuICAgIHNob3dQcm9jZXNzaW5nKG1lc3NhZ2U6IHN0cmluZywgZHVyYXRpb24/OiBudW1iZXIpIHtcbiAgICAgICAgdGhpcy5zaG93U3RhdHVzKG1lc3NhZ2UsICdwcm9jZXNzaW5nJywgZHVyYXRpb24pO1xuICAgICAgICB0aGlzLnNob3dQcm9ncmVzcyh0cnVlKTtcbiAgICB9XG5cbiAgICAvLyDmmL7npLrnirbmgIFcbiAgICBwcml2YXRlIHNob3dTdGF0dXMobWVzc2FnZTogc3RyaW5nLCB0eXBlOiAnaW5mbycgfCAnc3VjY2VzcycgfCAnd2FybmluZycgfCAnZXJyb3InIHwgJ2xvYWRpbmcnIHwgJ3VwbG9hZCcgfCAnY29weScgfCAncHJvY2Vzc2luZycsIGR1cmF0aW9uPzogbnVtYmVyKSB7XG4gICAgICAgIC8vIOa4hemZpOS5i+WJjeeahOi2heaXtlxuICAgICAgICBpZiAodGhpcy5oaWRlVGltZW91dCkge1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuaGlkZVRpbWVvdXQpO1xuICAgICAgICAgICAgdGhpcy5oaWRlVGltZW91dCA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOiuvue9rua2iOaBr1xuICAgICAgICB0aGlzLnN0YXR1c01lc3NhZ2UudGV4dENvbnRlbnQgPSBtZXNzYWdlO1xuXG4gICAgICAgIC8vIOiuvue9ruWbvuagh1xuICAgICAgICB0aGlzLnVwZGF0ZUljb24odHlwZSk7XG5cbiAgICAgICAgLy8gQ2xhdWRlIENvZGUgVXBkYXRlOiDkvb/nlKhDU1PnsbvogIzpnZ7lhoXogZTmoLflvI9cbiAgICAgICAgLy8g6K6+572u5qC35byPXG4gICAgICAgIHRoaXMuc3RhdHVzQ29udGFpbmVyLmNsYXNzTmFtZSA9IGBwcmV2aWV3LXN0YXR1cyBzdGF0dXMtJHt0eXBlfWA7XG4gICAgICAgIHRoaXMuc3RhdHVzQ29udGFpbmVyLnJlbW92ZUNsYXNzKCdoaWRkZW4nKTtcblxuICAgICAgICAvLyDmoLnmja7nsbvlnovmmL7npLov6ZqQ6JeP6L+b5bqm5p2h77yM6YG/5YWN6aaW5qyh5pi+56S65Ye6546w6L+b5bqm5p2h5LiO6auY5bqm5byC5bi4XG4gICAgICAgIGNvbnN0IHNob3dQcm9ncmVzcyA9IHR5cGUgPT09ICdsb2FkaW5nJyB8fCB0eXBlID09PSAndXBsb2FkJyB8fCB0eXBlID09PSAncHJvY2Vzc2luZyc7XG4gICAgICAgIHRoaXMuc2hvd1Byb2dyZXNzKHNob3dQcm9ncmVzcyk7XG5cbiAgICAgICAgLy8g5aaC5p6c5LiN5piv5Yqg6L29L+S4iuS8oC/lpITnkIbnirbmgIHkuJTorr7nva7kuobmjIHnu63ml7bpl7TvvIzoh6rliqjpmpDol49cbiAgICAgICAgaWYgKCFzaG93UHJvZ3Jlc3MgJiYgZHVyYXRpb24pIHtcbiAgICAgICAgICAgIHRoaXMuaGlkZVRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmhpZGVNZXNzYWdlKCk7XG4gICAgICAgICAgICB9LCBkdXJhdGlvbikgYXMgTm9kZUpTLlRpbWVvdXQ7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBDbGF1ZGUgQ29kZSBVcGRhdGU6IOS9v+eUqERPTSBBUEnmm7/ku6Npbm5lckhUTUzorr7nva5TVkflhoXlrrlcbiAgICAvLyDmm7TmlrDlm77moIdcbiAgICBwcml2YXRlIHVwZGF0ZUljb24odHlwZTogc3RyaW5nKSB7XG4gICAgICAgIGxldCBpY29uU3ZnID0gJyc7XG5cbiAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgICBjYXNlICdpbmZvJzpcbiAgICAgICAgICAgICAgICBpY29uU3ZnID0gYFxuICAgICAgICAgICAgICAgICAgICA8c3ZnIHZpZXdCb3g9XCIwIDAgMjQgMjRcIiBmaWxsPVwibm9uZVwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZS13aWR0aD1cIjJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxjaXJjbGUgY3g9XCIxMlwiIGN5PVwiMTJcIiByPVwiMTBcIi8+XG4gICAgICAgICAgICAgICAgICAgICAgICA8bGluZSB4MT1cIjEyXCIgeTE9XCIxNlwiIHgyPVwiMTJcIiB5Mj1cIjEyXCIvPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGxpbmUgeDE9XCIxMlwiIHkxPVwiOFwiIHgyPVwiMTIuMDFcIiB5Mj1cIjhcIi8+XG4gICAgICAgICAgICAgICAgICAgIDwvc3ZnPlxuICAgICAgICAgICAgICAgIGA7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdzdWNjZXNzJzpcbiAgICAgICAgICAgICAgICBpY29uU3ZnID0gYFxuICAgICAgICAgICAgICAgICAgICA8c3ZnIHZpZXdCb3g9XCIwIDAgMjQgMjRcIiBmaWxsPVwibm9uZVwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZS13aWR0aD1cIjJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9XCJNMjIgMTEuMDhWMTJhMTAgMTAgMCAxIDEtNS45My05LjE0XCIvPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHBvbHlsaW5lIHBvaW50cz1cIjIyLDQgMTIsMTQuMDEgOSwxMS4wMVwiLz5cbiAgICAgICAgICAgICAgICAgICAgPC9zdmc+XG4gICAgICAgICAgICAgICAgYDtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3dhcm5pbmcnOlxuICAgICAgICAgICAgICAgIGljb25TdmcgPSBgXG4gICAgICAgICAgICAgICAgICAgIDxzdmcgdmlld0JveD1cIjAgMCAyNCAyNFwiIGZpbGw9XCJub25lXCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMlwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHBhdGggZD1cIk0xMC4yOSAzLjg2TDEuODIgMThhMiAyIDAgMCAwIDEuNzEgM2gxNi45NGEyIDIgMCAwIDAgMS43MS0zTDEzLjcxIDMuODZhMiAyIDAgMCAwLTMuNDIgMHpcIi8+XG4gICAgICAgICAgICAgICAgICAgICAgICA8bGluZSB4MT1cIjEyXCIgeTE9XCI5XCIgeDI9XCIxMlwiIHkyPVwiMTNcIi8+XG4gICAgICAgICAgICAgICAgICAgICAgICA8bGluZSB4MT1cIjEyXCIgeTE9XCIxN1wiIHgyPVwiMTIuMDFcIiB5Mj1cIjE3XCIvPlxuICAgICAgICAgICAgICAgICAgICA8L3N2Zz5cbiAgICAgICAgICAgICAgICBgO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnZXJyb3InOlxuICAgICAgICAgICAgICAgIGljb25TdmcgPSBgXG4gICAgICAgICAgICAgICAgICAgIDxzdmcgdmlld0JveD1cIjAgMCAyNCAyNFwiIGZpbGw9XCJub25lXCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMlwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGNpcmNsZSBjeD1cIjEyXCIgY3k9XCIxMlwiIHI9XCIxMFwiLz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxsaW5lIHgxPVwiMTVcIiB5MT1cIjlcIiB4Mj1cIjlcIiB5Mj1cIjE1XCIvPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGxpbmUgeDE9XCI5XCIgeTE9XCI5XCIgeDI9XCIxNVwiIHkyPVwiMTVcIi8+XG4gICAgICAgICAgICAgICAgICAgIDwvc3ZnPlxuICAgICAgICAgICAgICAgIGA7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdsb2FkaW5nJzpcbiAgICAgICAgICAgICAgICBpY29uU3ZnID0gYFxuICAgICAgICAgICAgICAgICAgICA8c3ZnIHZpZXdCb3g9XCIwIDAgMjQgMjRcIiBmaWxsPVwibm9uZVwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZS13aWR0aD1cIjJcIiBjbGFzcz1cImxvYWRpbmctc3Bpbm5lclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHBhdGggZD1cIk0yMSAxMmE5IDkgMCAxMS02LjIxOS04LjU2XCIvPlxuICAgICAgICAgICAgICAgICAgICA8L3N2Zz5cbiAgICAgICAgICAgICAgICBgO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAndXBsb2FkJzpcbiAgICAgICAgICAgICAgICBpY29uU3ZnID0gYFxuICAgICAgICAgICAgICAgICAgICA8c3ZnIHZpZXdCb3g9XCIwIDAgMjQgMjRcIiBmaWxsPVwibm9uZVwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZS13aWR0aD1cIjJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9XCJNMjEgMTV2NGEyIDIgMCAwMS0yIDJINWEyIDIgMCAwMS0yLTJ2LTRcIi8+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cG9seWxpbmUgcG9pbnRzPVwiNywxMCAxMiwxNSAxNywxMFwiLz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxsaW5lIHgxPVwiMTJcIiB5MT1cIjE1XCIgeDI9XCIxMlwiIHkyPVwiM1wiLz5cbiAgICAgICAgICAgICAgICAgICAgPC9zdmc+XG4gICAgICAgICAgICAgICAgYDtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2NvcHknOlxuICAgICAgICAgICAgICAgIGljb25TdmcgPSBgXG4gICAgICAgICAgICAgICAgICAgIDxzdmcgdmlld0JveD1cIjAgMCAyNCAyNFwiIGZpbGw9XCJub25lXCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMlwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHJlY3QgeD1cIjlcIiB5PVwiOVwiIHdpZHRoPVwiMTNcIiBoZWlnaHQ9XCIxM1wiIHJ4PVwiMlwiIHJ5PVwiMlwiLz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9XCJNNSAxNUg0YTIgMiAwIDAxLTItMlY0YTIgMiAwIDAxMi0yaDlhMiAyIDAgMDEyIDJ2MVwiLz5cbiAgICAgICAgICAgICAgICAgICAgPC9zdmc+XG4gICAgICAgICAgICAgICAgYDtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3Byb2Nlc3NpbmcnOlxuICAgICAgICAgICAgICAgIGljb25TdmcgPSBgXG4gICAgICAgICAgICAgICAgICAgIDxzdmcgdmlld0JveD1cIjAgMCAyNCAyNFwiIGZpbGw9XCJub25lXCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMlwiIGNsYXNzPVwicHJvY2Vzc2luZy1pY29uXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPVwiTTEyIDJ2NlwiLz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9XCJNMTIgMTh2NFwiLz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9XCJNNC45MyA0LjkzbDQuMjQgNC4yNFwiLz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9XCJNMTQuODMgMTQuODNsNC4yNCA0LjI0XCIvPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHBhdGggZD1cIk0yIDEyaDZcIi8+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPVwiTTE4IDEyaDRcIi8+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPVwiTTQuOTMgMTkuMDdsNC4yNC00LjI0XCIvPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHBhdGggZD1cIk0xNC44MyA5LjE3bDQuMjQtNC4yNFwiLz5cbiAgICAgICAgICAgICAgICAgICAgPC9zdmc+XG4gICAgICAgICAgICAgICAgYDtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc3RhdHVzSWNvbi5lbXB0eSgpO1xuICAgICAgICB0aGlzLnN0YXR1c0ljb24uYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlUmFuZ2UoKS5jcmVhdGVDb250ZXh0dWFsRnJhZ21lbnQoaWNvblN2ZykpO1xuICAgIH1cblxuICAgIC8vIENsYXVkZSBDb2RlIFVwZGF0ZTog5L2/55SoRE9NIEFQSeabv+S7o2lubmVySFRNTFxuICAgIC8vIOaYvuekui/pmpDol4/ov5vluqbmnaFcbiAgICBwcml2YXRlIHNob3dQcm9ncmVzcyhzaG93OiBib29sZWFuKSB7XG4gICAgICAgIGlmIChzaG93KSB7XG4gICAgICAgICAgICB0aGlzLnByb2dyZXNzQmFyLnJlbW92ZUNsYXNzKCdoaWRkZW4nKTtcbiAgICAgICAgICAgIC8vIOa3u+WKoOi/m+W6puWKqOeUu1xuICAgICAgICAgICAgdGhpcy5wcm9ncmVzc0Jhci5lbXB0eSgpO1xuICAgICAgICAgICAgdGhpcy5wcm9ncmVzc0Jhci5jcmVhdGVEaXYoeyBjbHM6ICdwcm9ncmVzcy1iYXItZmlsbCcgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnByb2dyZXNzQmFyLmFkZENsYXNzKCdoaWRkZW4nKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIOabtOaWsOi/m+W6plxuICAgIHVwZGF0ZVByb2dyZXNzKHBlcmNlbnQ6IG51bWJlcikge1xuICAgICAgICBjb25zdCBwcm9ncmVzc0ZpbGwgPSB0aGlzLnByb2dyZXNzQmFyLnF1ZXJ5U2VsZWN0b3IoJy5wcm9ncmVzcy1iYXItZmlsbCcpIGFzIEhUTUxFbGVtZW50O1xuICAgICAgICBpZiAocHJvZ3Jlc3NGaWxsKSB7XG4gICAgICAgICAgICAvLyDov5vluqbmnaHlrr3luqbpnIDopoHliqjmgIHorqHnrpfvvIzkv53nlZnlhoXogZTmoLflvI9cbiAgICAgICAgICAgIHByb2dyZXNzRmlsbC5zdHlsZS53aWR0aCA9IGAke01hdGgubWluKDEwMCwgTWF0aC5tYXgoMCwgcGVyY2VudCkpfSVgO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gQ2xhdWRlIENvZGUgVXBkYXRlOiDkvb/nlKhDU1PnsbvogIzpnZ7lhoXogZTmoLflvI9cbiAgICAvLyDpmpDol4/mtojmga9cbiAgICBoaWRlTWVzc2FnZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuaGlkZVRpbWVvdXQpIHtcbiAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aGlzLmhpZGVUaW1lb3V0KTtcbiAgICAgICAgICAgIHRoaXMuaGlkZVRpbWVvdXQgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnN0YXR1c0NvbnRhaW5lci5hZGRDbGFzcygnaGlkZGVuJyk7XG4gICAgICAgIHRoaXMuc2hvd1Byb2dyZXNzKGZhbHNlKTtcbiAgICB9XG5cbiAgICAvLyDmo4Dmn6XmmK/lkKblj6/op4FcbiAgICBpc1Zpc2libGUoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiAhdGhpcy5zdGF0dXNDb250YWluZXIuaGFzQ2xhc3MoJ2hpZGRlbicpO1xuICAgIH1cblxuICAgIC8vIOiOt+WPluW9k+WJjea2iOaBr1xuICAgIGdldEN1cnJlbnRNZXNzYWdlKCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiB0aGlzLnN0YXR1c01lc3NhZ2UudGV4dENvbnRlbnQgfHwgJyc7XG4gICAgfVxuXG4gICAgLy8g6I635Y+W5b2T5YmN54q25oCB57G75Z6LXG4gICAgZ2V0Q3VycmVudFR5cGUoKTogc3RyaW5nIHtcbiAgICAgICAgY29uc3QgY2xhc3NOYW1lID0gdGhpcy5zdGF0dXNDb250YWluZXIuY2xhc3NOYW1lO1xuICAgICAgICBjb25zdCBtYXRjaCA9IGNsYXNzTmFtZS5tYXRjaCgvc3RhdHVzLShcXHcrKS8pO1xuICAgICAgICByZXR1cm4gbWF0Y2ggPyBtYXRjaFsxXSA6ICcnO1xuICAgIH1cblxuICAgIC8vIOiuvue9rueCueWHu+WkhOeQhuWZqFxuICAgIHNldENsaWNrSGFuZGxlcihoYW5kbGVyOiAoKSA9PiB2b2lkKSB7XG4gICAgICAgIHRoaXMuc3RhdHVzQ29udGFpbmVyLm9uY2xpY2sgPSBoYW5kbGVyO1xuICAgICAgICB0aGlzLnN0YXR1c0NvbnRhaW5lci5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XG4gICAgfVxuXG4gICAgLy8g56e76Zmk54K55Ye75aSE55CG5ZmoXG4gICAgcmVtb3ZlQ2xpY2tIYW5kbGVyKCkge1xuICAgICAgICB0aGlzLnN0YXR1c0NvbnRhaW5lci5vbmNsaWNrID0gbnVsbDtcbiAgICAgICAgdGhpcy5zdGF0dXNDb250YWluZXIuc3R5bGUuY3Vyc29yID0gJ2RlZmF1bHQnO1xuICAgIH1cblxuICAgIC8vIENsYXVkZSBDb2RlIFVwZGF0ZTog5L2/55SoRE9NIEFQSeabv+S7o2lubmVySFRNTOiuvue9rlNWR+WGheWuuVxuICAgIC8vIOa3u+WKoOWFs+mXreaMiemSrlxuICAgIGFkZENsb3NlQnV0dG9uKCkge1xuICAgICAgICBjb25zdCBjbG9zZUJ0biA9IHRoaXMuc3RhdHVzQ29udGFpbmVyLmNyZWF0ZURpdih7IGNsczogJ3N0YXR1cy1jbG9zZScgfSk7XG4gICAgICAgIGNvbnN0IGNsb3NlU3ZnID0gYFxuICAgICAgICAgICAgPHN2ZyB2aWV3Qm94PVwiMCAwIDI0IDI0XCIgZmlsbD1cIm5vbmVcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2Utd2lkdGg9XCIyXCI+XG4gICAgICAgICAgICAgICAgPGxpbmUgeDE9XCIxOFwiIHkxPVwiNlwiIHgyPVwiNlwiIHkyPVwiMThcIi8+XG4gICAgICAgICAgICAgICAgPGxpbmUgeDE9XCI2XCIgeTE9XCI2XCIgeDI9XCIxOFwiIHkyPVwiMThcIi8+XG4gICAgICAgICAgICA8L3N2Zz5cbiAgICAgICAgYDtcbiAgICAgICAgY2xvc2VCdG4uYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlUmFuZ2UoKS5jcmVhdGVDb250ZXh0dWFsRnJhZ21lbnQoY2xvc2VTdmcpKTtcbiAgICAgICAgY2xvc2VCdG4ub25jbGljayA9IChlKSA9PiB7XG4gICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgdGhpcy5oaWRlTWVzc2FnZSgpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8vIOenu+mZpOWFs+mXreaMiemSrlxuICAgIHJlbW92ZUNsb3NlQnV0dG9uKCkge1xuICAgICAgICBjb25zdCBjbG9zZUJ0biA9IHRoaXMuc3RhdHVzQ29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJy5zdGF0dXMtY2xvc2UnKTtcbiAgICAgICAgaWYgKGNsb3NlQnRuKSB7XG4gICAgICAgICAgICBjbG9zZUJ0bi5yZW1vdmUoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIOiuvue9ruS9jee9rlxuICAgIHNldFBvc2l0aW9uKHBvc2l0aW9uOiAndG9wJyB8ICdib3R0b20nIHwgJ2NlbnRlcicpIHtcbiAgICAgICAgdGhpcy5zdGF0dXNDb250YWluZXIucmVtb3ZlQ2xhc3MoJ3N0YXR1cy10b3AnKTtcbiAgICAgICAgdGhpcy5zdGF0dXNDb250YWluZXIucmVtb3ZlQ2xhc3MoJ3N0YXR1cy1ib3R0b20nKTtcbiAgICAgICAgdGhpcy5zdGF0dXNDb250YWluZXIucmVtb3ZlQ2xhc3MoJ3N0YXR1cy1jZW50ZXInKTtcbiAgICAgICAgdGhpcy5zdGF0dXNDb250YWluZXIuYWRkQ2xhc3MoYHN0YXR1cy0ke3Bvc2l0aW9ufWApO1xuICAgIH1cblxuICAgIC8vIOiOt+WPlueKtuaAgeWuueWZqOWFg+e0oFxuICAgIGdldEVsZW1lbnQoKTogSFRNTERpdkVsZW1lbnQge1xuICAgICAgICByZXR1cm4gdGhpcy5zdGF0dXNDb250YWluZXI7XG4gICAgfVxuXG4gICAgLy8g6ZSA5q+B57uE5Lu2XG4gICAgZGVzdHJveSgpIHtcbiAgICAgICAgaWYgKHRoaXMuaGlkZVRpbWVvdXQpIHtcbiAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aGlzLmhpZGVUaW1lb3V0KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnN0YXR1c0NvbnRhaW5lci5yZW1vdmUoKTtcbiAgICB9XG59XG4iXX0=