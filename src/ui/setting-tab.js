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
import { PluginSettingTab, Setting, Notice, sanitizeHTMLToDom } from 'obsidian';
// 使用新的API客户端
import { wxGetToken } from '../services/api';
import { cleanMathCache } from '../services/renderer/markdown/math';
import { WxSettings } from '../core/settings';
// 移除DocModal导入，不再使用弹窗文档
// import { DocModal } from './doc-modal';
export class WxSettingTab extends PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
        this.settings = WxSettings.getInstance();
        this.wxInfo = this.parseWXInfo();
    }
    displayWXInfo(txt) {
        var _a;
        (_a = this.wxTextArea) === null || _a === void 0 ? void 0 : _a.setValue(txt);
    }
    parseWXInfo() {
        const wxInfo = this.settings.wxInfo;
        if (wxInfo.length == 0) {
            return '';
        }
        let res = '';
        for (let wx of wxInfo) {
            res += `${wx.name}|${wx.appid}|********\n`;
        }
        return res;
    }
    async testWXInfo() {
        // Claude Code Remove: 移除authKey变量，不再需要注册码验证
        const wxInfo = this.settings.wxInfo;
        if (wxInfo.length == 0) {
            new Notice('请先设置公众号信息');
            return;
        }
        try {
            // 移除不再使用的docUrl变量
            // Claude Code Update
            for (let wx of wxInfo) {
                try {
                    const tokenInfo = await wxGetToken(wx.appid, wx.secret);
                    if (tokenInfo.access_token && tokenInfo.access_token.length > 0) {
                        new Notice(`${wx.name} 测试通过`);
                    }
                    else {
                        new Notice(`${wx.name} 测试失败：未获取到有效token`);
                    }
                }
                catch (error) {
                    // 简化错误提示，与v2版本保持一致，只使用Notice，并显示当前IP
                    let message = `${wx.name} 测试失败：${error.message || error}`;
                    if (error.message && error.message.includes('40125')) {
                        message = `${wx.name} 测试失败：AppSecret无效 (错误码40125)。请检查：\n1. AppSecret是否正确（长度应为32位）\n2. 是否使用了测试号的AppSecret但配置了正式号的AppID\n3. AppSecret是否已过期或被重置\n4. 公众号类型是否支持此API`;
                    }
                    else if (error.message && (error.message.includes('40164') || error.message.includes('IP') || error.message.includes('whitelist'))) {
                        // 从错误消息中提取IP地址，支持多种格式
                        let currentIP = '未知';
                        // 匹配格式：invalid ip 223.87.218.98 或 IP 223.87.218.98
                        const ipMatch = error.message.match(/(?:invalid ip|IP)[:\s]+(\d+\.\d+\.\d+\.\d+)/i);
                        if (ipMatch) {
                            currentIP = ipMatch[1];
                        }
                        else {
                            // 匹配纯IP地址格式
                            const pureIpMatch = error.message.match(/(\d+\.\d+\.\d+\.\d+)/);
                            if (pureIpMatch) {
                                currentIP = pureIpMatch[1];
                            }
                        }
                        message = `${wx.name} 测试失败：IP地址 ${currentIP} 不在白名单中，请将此IP添加到微信公众平台白名单`;
                    }
                    else if (error.message && error.message.includes('50002')) {
                        message = `${wx.name} 测试失败：用户受限，可能是公众号被冻结`;
                    }
                    new Notice(message);
                    break;
                }
            }
        }
        catch (error) {
            new Notice(`测试失败：${error}`);
        }
    }
    // 采用v2版本直接保存方式，不再加密
    // Claude Code Update: 增加authKey参数
    async saveWXInfo(authKey) {
        if (this.wxInfo.length == 0) {
            new Notice('请输入内容');
            return false;
        }
        if (this.settings.wxInfo.length > 0) {
            new Notice('已经保存过了，请先清除！');
            return false;
        }
        // Claude Code ADD: 验证authKey
        if (!authKey || authKey.trim().length === 0) {
            new Notice('请先验证AuthKey');
            return false;
        }
        const wechat = [];
        const lines = this.wxInfo.split('\n');
        for (let line of lines) {
            line = line.trim();
            if (line.length == 0) {
                continue;
            }
            const items = line.split('|');
            if (items.length != 3) {
                new Notice('格式错误，请检查');
                return false;
            }
            // 确保所有字段都被正确trim处理
            const name = items[0].trim();
            const appid = items[1].trim();
            const secret = items[2].trim();
            wechat.push({ name, appid, secret });
        }
        if (wechat.length == 0) {
            return false;
        }
        try {
            // Claude Code ADD: 先同步到后端数据库
            const { getWechatClient } = await import('../services/api');
            const wechatClient = getWechatClient();
            for (let wx of wechat) {
                try {
                    await wechatClient.registerAccount({
                        app_id: wx.appid,
                        app_secret: wx.secret,
                        name: wx.name,
                        auth_key: authKey.trim()
                    });
                }
                catch (error) {
                    // Claude Code Update: 同步失败时阻止保存
                    new Notice(`同步公众号 ${wx.name} 到后端失败: ${error.message || error}`);
                    return false;
                }
            }
            // 直接保存微信信息，不再加密
            this.settings.wxInfo = wechat;
            await this.plugin.saveSettings();
            this.wxInfo = this.parseWXInfo();
            this.displayWXInfo(this.wxInfo);
            new Notice('保存成功');
            return true;
        }
        catch (error) {
            new Notice(`保存失败：${error}`);
            console.error(error);
        }
        return false;
    }
    async clear() {
        this.settings.wxInfo = [];
        await this.plugin.saveSettings();
        this.wxInfo = '';
        this.displayWXInfo('');
    }
    // Claude Code Update: 重构display方法，调整设置顺序并添加新设置项
    display() {
        const { containerEl } = this;
        containerEl.empty();
        this.wxInfo = this.parseWXInfo();
        const helpEl = containerEl.createEl('div');
        helpEl.style.cssText = 'display: flex;flex-direction: row;align-items: center;';
        helpEl.createEl('h2', { text: '帮助文档' }).style.cssText = 'margin-right: 10px;';
        helpEl.createEl('a', { text: 'https://github.com/IsHexx/WDWXEdit', attr: { href: 'https://github.com/IsHexx/WDWXEdit' } });
        // ==================== 主题与样式设置 ====================
        containerEl.createEl('h2', { text: '主题与样式' });
        new Setting(containerEl)
            .setName('默认样式')
            .addDropdown(dropdown => {
            const styles = this.plugin.assetsManager.themes;
            for (let s of styles) {
                dropdown.addOption(s.className, s.name);
            }
            dropdown.setValue(this.settings.defaultStyle);
            dropdown.onChange(async (value) => {
                this.settings.defaultStyle = value;
                await this.plugin.saveSettings();
            });
        });
        new Setting(containerEl)
            .setName('代码高亮')
            .addDropdown(dropdown => {
            const styles = this.plugin.assetsManager.highlights;
            for (let s of styles) {
                dropdown.addOption(s.name, s.name);
            }
            dropdown.setValue(this.settings.defaultHighlight);
            dropdown.onChange(async (value) => {
                this.settings.defaultHighlight = value;
                await this.plugin.saveSettings();
            });
        });
        new Setting(containerEl)
            .setName('获取更多主题')
            .addButton(button => {
            button.setButtonText('下载');
            button.onClick(async () => {
                button.setButtonText('下载中...');
                await this.plugin.assetsManager.downloadThemes();
                button.setButtonText('下载完成');
            });
        })
            .addButton(button => {
            button.setIcon('folder-open');
            button.onClick(async () => {
                await this.plugin.assetsManager.openAssets();
            });
        });
        new Setting(containerEl)
            .setName('清空主题')
            .addButton(button => {
            button.setButtonText('清空');
            button.onClick(async () => {
                await this.plugin.assetsManager.removeThemes();
                this.settings.resetStyelAndHighlight();
                await this.plugin.saveSettings();
            });
        });
        new Setting(containerEl)
            .setName('在工具栏展示样式选择')
            .setDesc('建议在移动端关闭，可以增大文章预览区域')
            .addToggle(toggle => {
            toggle.setValue(this.settings.showStyleUI);
            toggle.onChange(async (value) => {
                this.settings.showStyleUI = value;
                await this.plugin.saveSettings();
            });
        });
        // Claude Code ADD: 新增样式编辑器设置
        new Setting(containerEl)
            .setName('字体')
            .setDesc('设置文章字体')
            .addDropdown(dropdown => {
            dropdown.addOption('等线', '等线');
            dropdown.addOption('宋体', '宋体');
            dropdown.addOption('黑体', '黑体');
            dropdown.addOption('微软雅黑', '微软雅黑');
            dropdown.addOption('楷体', '楷体');
            dropdown.setValue(this.settings.fontFamily);
            dropdown.onChange(async (value) => {
                this.settings.fontFamily = value;
                await this.plugin.saveSettings();
            });
        });
        new Setting(containerEl)
            .setName('字号')
            .setDesc('设置文章字号')
            .addDropdown(dropdown => {
            dropdown.addOption('较小', '较小');
            dropdown.addOption('推荐', '推荐');
            dropdown.addOption('较大', '较大');
            dropdown.setValue(this.settings.fontSize);
            dropdown.onChange(async (value) => {
                this.settings.fontSize = value;
                await this.plugin.saveSettings();
            });
        });
        new Setting(containerEl)
            .setName('主题色')
            .setDesc('设置文章主题色')
            .addText(text => {
            text.setPlaceholder('#2d3748')
                .setValue(this.settings.primaryColor)
                .onChange(async (value) => {
                this.settings.primaryColor = value.trim();
                await this.plugin.saveSettings();
            })
                .inputEl.setAttr('style', 'width: 120px;');
        });
        // ==================== 内容渲染设置 ====================
        containerEl.createEl('h2', { text: '内容渲染' });
        new Setting(containerEl)
            .setName('链接展示样式')
            .addDropdown(dropdown => {
            dropdown.addOption('inline', '内嵌');
            dropdown.addOption('footnote', '脚注');
            dropdown.setValue(this.settings.linkStyle);
            dropdown.onChange(async (value) => {
                this.settings.linkStyle = value;
                await this.plugin.saveSettings();
            });
        });
        new Setting(containerEl)
            .setName('文件嵌入展示样式')
            .addDropdown(dropdown => {
            dropdown.addOption('quote', '引用');
            dropdown.addOption('content', '正文');
            dropdown.setValue(this.settings.embedStyle);
            dropdown.onChange(async (value) => {
                this.settings.embedStyle = value;
                await this.plugin.saveSettings();
            });
        });
        new Setting(containerEl)
            .setName('数学公式语法')
            .addDropdown(dropdown => {
            dropdown.addOption('latex', 'latex');
            dropdown.addOption('asciimath', 'asciimath');
            dropdown.setValue(this.settings.math);
            dropdown.onChange(async (value) => {
                this.settings.math = value;
                cleanMathCache();
                await this.plugin.saveSettings();
            });
        });
        new Setting(containerEl)
            .setName('显示代码行号')
            .addToggle(toggle => {
            toggle.setValue(this.settings.lineNumber);
            toggle.onChange(async (value) => {
                this.settings.lineNumber = value;
                await this.plugin.saveSettings();
            });
        });
        new Setting(containerEl)
            .setName('启用空行渲染')
            .addToggle(toggle => {
            toggle.setValue(this.settings.enableEmptyLine);
            toggle.onChange(async (value) => {
                this.settings.enableEmptyLine = value;
                await this.plugin.saveSettings();
            });
        });
        new Setting(containerEl)
            .setName('渲染图片标题')
            .addToggle(toggle => {
            toggle.setValue(this.settings.useFigcaption);
            toggle.onChange(async (value) => {
                this.settings.useFigcaption = value;
                await this.plugin.saveSettings();
            });
        });
        // ==================== 排版设置 ====================
        containerEl.createEl('h2', { text: '排版设置' });
        // Claude Code ADD: 新增排版设置
        new Setting(containerEl)
            .setName('段落间距')
            .addDropdown(dropdown => {
            dropdown.addOption('紧凑', '紧凑');
            dropdown.addOption('正常', '正常');
            dropdown.addOption('宽松', '宽松');
            dropdown.setValue(this.settings.paragraphSpacing);
            dropdown.onChange(async (value) => {
                this.settings.paragraphSpacing = value;
                await this.plugin.saveSettings();
            });
        });
        new Setting(containerEl)
            .setName('首行缩进')
            .setDesc('段落首行是否缩进两个字符')
            .addToggle(toggle => {
            toggle.setValue(this.settings.firstLineIndent);
            toggle.onChange(async (value) => {
                this.settings.firstLineIndent = value;
                await this.plugin.saveSettings();
            });
        });
        new Setting(containerEl)
            .setName('标题对齐')
            .addDropdown(dropdown => {
            dropdown.addOption('left', '左对齐');
            dropdown.addOption('center', '居中');
            dropdown.setValue(this.settings.headingAlign);
            dropdown.onChange(async (value) => {
                this.settings.headingAlign = value;
                await this.plugin.saveSettings();
            });
        });
        // ==================== 图片处理设置 ====================
        containerEl.createEl('h2', { text: '图片处理' });
        new Setting(containerEl)
            .setName('水印图片')
            .setDesc('输入vault中的图片文件名')
            .addText(text => {
            text.setPlaceholder('请输入图片名称')
                .setValue(this.settings.watermark)
                .onChange(async (value) => {
                this.settings.watermark = value.trim();
                await this.plugin.saveSettings();
            })
                .inputEl.setAttr('style', 'width: 320px;');
        });
        // Claude Code ADD: 新增图片处理设置
        new Setting(containerEl)
            .setName('自动压缩图片')
            .setDesc('上传前自动压缩图片以提高加载速度')
            .addToggle(toggle => {
            toggle.setValue(this.settings.autoCompressImage);
            toggle.onChange(async (value) => {
                this.settings.autoCompressImage = value;
                await this.plugin.saveSettings();
            });
        });
        new Setting(containerEl)
            .setName('图片压缩质量')
            .setDesc('压缩质量（0.1-1.0），数值越高质量越好但文件越大')
            .addText(text => {
            text.setPlaceholder('0.9')
                .setValue(String(this.settings.imageQuality))
                .onChange(async (value) => {
                const quality = parseFloat(value);
                if (!isNaN(quality) && quality >= 0.1 && quality <= 1.0) {
                    this.settings.imageQuality = quality;
                    await this.plugin.saveSettings();
                }
            })
                .inputEl.setAttr('style', 'width: 120px;');
        });
        new Setting(containerEl)
            .setName('图片最大宽度')
            .setDesc('图片最大宽度限制（像素）')
            .addText(text => {
            text.setPlaceholder('1200')
                .setValue(String(this.settings.imageMaxWidth))
                .onChange(async (value) => {
                const width = parseInt(value);
                if (!isNaN(width) && width > 0) {
                    this.settings.imageMaxWidth = width;
                    await this.plugin.saveSettings();
                }
            })
                .inputEl.setAttr('style', 'width: 120px;');
        });
        // ==================== 自定义样式 ====================
        containerEl.createEl('h2', { text: '自定义样式' });
        new Setting(containerEl)
            .setName('全局CSS属性')
            .setDesc('只能填写CSS属性，不能写选择器')
            .addTextArea(text => {
            this.wxTextArea = text;
            text.setPlaceholder('请输入CSS属性，如：background: #fff;padding: 10px;')
                .setValue(this.settings.baseCSS)
                .onChange(async (value) => {
                this.settings.baseCSS = value;
                await this.plugin.saveSettings();
            })
                .inputEl.setAttr('style', 'width: 520px; height: 60px;');
        });
        const customCSSDoc = '使用指南：<a href="https://github.com/IsHexx/WDWXEdit">https://github.com/IsHexx/WDWXEdit</a>';
        new Setting(containerEl)
            .setName('自定义CSS笔记')
            .setDesc(sanitizeHTMLToDom(customCSSDoc))
            .addText(text => {
            text.setPlaceholder('请输入自定义CSS笔记标题')
                .setValue(this.settings.customCSSNote)
                .onChange(async (value) => {
                this.settings.customCSSNote = value.trim();
                await this.plugin.saveSettings();
                await this.plugin.assetsManager.loadCustomCSS();
            })
                .inputEl.setAttr('style', 'width: 320px;');
        });
        // ==================== 导出设置 ====================
        containerEl.createEl('h2', { text: '导出设置' });
        // Claude Code ADD: 新增导出设置
        new Setting(containerEl)
            .setName('默认导出格式')
            .addDropdown(dropdown => {
            dropdown.addOption('copy', '复制到剪贴板');
            dropdown.addOption('draft', '保存为草稿');
            dropdown.addOption('image', '导出为图片');
            dropdown.setValue(this.settings.defaultExportFormat);
            dropdown.onChange(async (value) => {
                this.settings.defaultExportFormat = value;
                await this.plugin.saveSettings();
            });
        });
        new Setting(containerEl)
            .setName('自动保存草稿')
            .setDesc('复制内容时自动保存到公众号草稿箱')
            .addToggle(toggle => {
            toggle.setValue(this.settings.autoSaveDraft);
            toggle.onChange(async (value) => {
                this.settings.autoSaveDraft = value;
                await this.plugin.saveSettings();
            });
        });
        // ==================== 预览设置 ====================
        containerEl.createEl('h2', { text: '预览设置' });
        // Claude Code ADD: 新增预览设置
        new Setting(containerEl)
            .setName('预览窗口宽度')
            .setDesc('预览窗口的默认宽度（像素）')
            .addText(text => {
            text.setPlaceholder('800')
                .setValue(String(this.settings.previewWidth))
                .onChange(async (value) => {
                const width = parseInt(value);
                if (!isNaN(width) && width > 0) {
                    this.settings.previewWidth = width;
                    await this.plugin.saveSettings();
                }
            })
                .inputEl.setAttr('style', 'width: 120px;');
        });
        new Setting(containerEl)
            .setName('预览更新延迟')
            .setDesc('预览自动刷新的延迟时间（毫秒）')
            .addText(text => {
            text.setPlaceholder('500')
                .setValue(String(this.settings.previewDelay))
                .onChange(async (value) => {
                const delay = parseInt(value);
                if (!isNaN(delay) && delay >= 0) {
                    this.settings.previewDelay = delay;
                    await this.plugin.saveSettings();
                }
            })
                .inputEl.setAttr('style', 'width: 120px;');
        });
        // ==================== 公众号配置 ====================
        containerEl.createEl('h2', { text: '公众号配置' });
        // Claude Code ADD: 新增默认公众号选择
        new Setting(containerEl)
            .setName('默认公众号')
            .setDesc('选择默认使用的公众号账号')
            .addDropdown(dropdown => {
            dropdown.addOption('', '请选择');
            if (this.settings.wxInfo && this.settings.wxInfo.length > 0) {
                for (let wx of this.settings.wxInfo) {
                    dropdown.addOption(wx.appid, wx.name);
                }
            }
            dropdown.setValue(this.settings.defaultWxAccount);
            dropdown.onChange(async (value) => {
                this.settings.defaultWxAccount = value;
                await this.plugin.saveSettings();
            });
        });
        // Claude Code ADD: 添加AuthKey输入框
        let authKeyValue = '';
        let authKeyVerified = false;
        new Setting(containerEl)
            .setName('认证密钥 (AuthKey)')
            .setDesc('请先输入由管理员提供的AuthKey，验证通过后才能保存公众号信息')
            .addText(text => {
            text.setPlaceholder('请输入AuthKey')
                .setValue('')
                .onChange(value => {
                authKeyValue = value;
                authKeyVerified = false;
            });
            text.inputEl.setAttr('style', 'width: 400px;');
        })
            .addButton(button => {
            button.setButtonText('验证AuthKey');
            button.onClick(async () => {
                if (!authKeyValue || authKeyValue.trim().length === 0) {
                    new Notice('请输入AuthKey');
                    return;
                }
                button.setButtonText('验证中...');
                try {
                    const { getWechatClient } = await import('../services/api');
                    const wechatClient = getWechatClient();
                    const result = await wechatClient.verifyAuthKey(authKeyValue.trim());
                    if (result.is_valid) {
                        authKeyVerified = true;
                        const vipText = result.is_vip ? ' (VIP账户)' : ' (普通账户)';
                        const accountText = result.can_register
                            ? `可注册 ${result.max_accounts - result.registered_accounts} 个公众号`
                            : '已达到最大账户数量';
                        new Notice(`AuthKey验证成功${vipText}\n${accountText}`);
                        button.setButtonText('✓ 已验证');
                    }
                    else {
                        authKeyVerified = false;
                        new Notice('AuthKey无效或已过期');
                        button.setButtonText('验证AuthKey');
                    }
                }
                catch (error) {
                    authKeyVerified = false;
                    new Notice(`验证失败：${error.message || error}`);
                    button.setButtonText('验证AuthKey');
                }
            });
        });
        let isClear = this.settings.wxInfo.length > 0;
        let isRealClear = false;
        const buttonText = isClear ? '清空公众号信息' : '保存公众号信息';
        new Setting(containerEl)
            .setName('公众号信息')
            .addTextArea(text => {
            this.wxTextArea = text;
            text.setPlaceholder('请输入公众号信息\n格式：公众号名称|公众号AppID|公众号AppSecret\n多个公众号请换行输入\n输入完成后点击保存按钮')
                .setValue(this.wxInfo)
                .onChange(value => {
                this.wxInfo = value;
            })
                .inputEl.setAttr('style', 'width: 520px; height: 120px;');
        });
        new Setting(containerEl).addButton(button => {
            button.setButtonText(buttonText);
            button.onClick(async () => {
                if (isClear) {
                    isRealClear = true;
                    isClear = false;
                    button.setButtonText('确认清空?');
                }
                else if (isRealClear) {
                    isRealClear = false;
                    isClear = false;
                    this.clear();
                    button.setButtonText('保存公众号信息');
                }
                else {
                    // Claude Code ADD: 检查AuthKey是否已验证
                    if (!authKeyVerified) {
                        new Notice('请先验证AuthKey');
                        return;
                    }
                    button.setButtonText('保存中...');
                    if (await this.saveWXInfo(authKeyValue)) {
                        isClear = true;
                        isRealClear = false;
                        button.setButtonText('清空公众号信息');
                    }
                    else {
                        button.setButtonText('保存公众号信息');
                    }
                }
            });
        })
            .addButton(button => {
            button.setButtonText('测试公众号');
            button.onClick(async () => {
                button.setButtonText('测试中...');
                await this.testWXInfo();
                button.setButtonText('测试公众号');
            });
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dGluZy10YWIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzZXR0aW5nLXRhYi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7O0dBWUc7QUFFSCxPQUFPLEVBQTBCLGdCQUFnQixFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxVQUFVLENBQUM7QUFHeEcsYUFBYTtBQUNiLE9BQU8sRUFBRSxVQUFVLEVBQW1CLE1BQU0saUJBQWlCLENBQUM7QUFFOUQsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLG9DQUFvQyxDQUFDO0FBQ3BFLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQUM5Qyx3QkFBd0I7QUFDeEIsMENBQTBDO0FBRTFDLE1BQU0sT0FBTyxZQUFhLFNBQVEsZ0JBQWdCO0lBTWpELFlBQVksR0FBUSxFQUFFLE1BQW9CO1FBQ3pDLEtBQUssQ0FBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDbkIsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFDckIsSUFBSSxDQUFDLFFBQVEsR0FBRyxVQUFVLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDekMsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDbEMsQ0FBQztJQUVELGFBQWEsQ0FBQyxHQUFVOztRQUNwQixNQUFBLElBQUksQ0FBQyxVQUFVLDBDQUFFLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNuQyxDQUFDO0lBRUQsV0FBVztRQUNQLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDO1FBQ3ZDLElBQUksTUFBTSxDQUFDLE1BQU0sSUFBSSxDQUFDLEVBQUU7WUFDdkIsT0FBTyxFQUFFLENBQUM7U0FDVjtRQUVELElBQUksR0FBRyxHQUFHLEVBQUUsQ0FBQztRQUNiLEtBQUssSUFBSSxFQUFFLElBQUksTUFBTSxFQUFFO1lB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QUNyQixXQUFXLEdBQUcsS0FBSyxDQUFDO29CQUNwQixPQUFPLEdBQUcsS0FBSyxDQUFDO29CQUNoQixJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBQ2IsTUFBTSxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQztpQkFDaEM7cUJBQ0k7b0JBQ0osa0NBQWtDO29CQUNsQyxJQUFJLENBQUMsZUFBZSxFQUFFO3dCQUNyQixJQUFJLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQzt3QkFDMUIsT0FBTztxQkFDUDtvQkFFRCxNQUFNLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO29CQUMvQixJQUFJLE1BQU0sSUFBSSxDQUFDLFVBQVUsQ0FBQyxZQUFZLENBQUMsRUFBRTt3QkFDeEMsT0FBTyxHQUFHLElBQUksQ0FBQzt3QkFDZixXQUFXLEdBQUcsS0FBSyxDQUFDO3dCQUNwQixNQUFNLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFDO3FCQUNoQzt5QkFDSTt3QkFDSixNQUFNLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFDO3FCQUNoQztpQkFDRDtZQUNGLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDO2FBQ0QsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFO1lBQ25CLE1BQU0sQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDOUIsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLElBQUksRUFBRTtnQkFDekIsTUFBTSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDL0IsTUFBTSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ3hCLE1BQU0sQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDL0IsQ0FBQyxDQUFDLENBQUE7UUFDSCxDQUFDLENBQUMsQ0FBQTtJQUNILENBQUM7Q0FDRCIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMjQtMjAyNSBJc0hleHhcbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb2Z0d2FyZSBpcyBwcm9wcmlldGFyeSBhbmQgY29uZmlkZW50aWFsLiBObyBwYXJ0IG9mIHRoaXMgc29mdHdhcmVcbiAqIG1heSBiZSByZXByb2R1Y2VkLCBkaXN0cmlidXRlZCwgb3IgdHJhbnNtaXR0ZWQgaW4gYW55IGZvcm0gb3IgYnkgYW55IG1lYW5zLFxuICogaW5jbHVkaW5nIHBob3RvY29weWluZywgcmVjb3JkaW5nLCBvciBvdGhlciBlbGVjdHJvbmljIG9yIG1lY2hhbmljYWwgbWV0aG9kcyxcbiAqIHdpdGhvdXQgdGhlIHByaW9yIHdyaXR0ZW4gcGVybWlzc2lvbiBvZiB0aGUgYXV0aG9yLCBleGNlcHQgaW4gdGhlIGNhc2Ugb2ZcbiAqIGJyaWVmIHF1b3RhdGlvbnMgZW1ib2RpZWQgaW4gY3JpdGljYWwgcmV2aWV3cyBhbmQgY2VydGFpbiBvdGhlciBub25jb21tZXJjaWFsXG4gKiB1c2VzIHBlcm1pdHRlZCBieSBjb3B5cmlnaHQgbGF3LlxuICpcbiAqIEZvciBwZXJtaXNzaW9uIHJlcXVlc3RzLCBjb250YWN0OiBJc0hleHhcbiAqL1xuXG5pbXBvcnQgeyBBcHAsIFRleHRBcmVhQ29tcG9uZW50LCBQbHVnaW5TZXR0aW5nVGFiLCBTZXR0aW5nLCBOb3RpY2UsIHNhbml0aXplSFRNTFRvRG9tIH0gZnJvbSAnb2JzaWRpYW4nO1xuLy8g5pu05pawaW1wb3J06Lev5b6EXG5pbXBvcnQgV3hFZGl0UGx1Z2luIGZyb20gJy4uL2NvcmUvbWFpbic7XG4vLyDkvb/nlKjmlrDnmoRBUEnlrqLmiLfnq69cbmltcG9ydCB7IHd4R2V0VG9rZW4sIGdldFdlY2hhdENsaWVudCB9IGZyb20gJy4uL3NlcnZpY2VzL2FwaSc7XG5pbXBvcnQgeyB3eEVuY3J5cHQgfSBmcm9tICcuLi9zZXJ2aWNlcy93ZWNoYXQvd2VpeGluLWFwaSc7IC8vIOS/neeVmeWvueWKoOWvhuWHveaVsOeahOW8leeUqO+8jOWboOS4uuaWsEFQSeS4reWPr+iDveayoeaciei/meS4qlxuaW1wb3J0IHsgY2xlYW5NYXRoQ2FjaGUgfSBmcm9tICcuLi9zZXJ2aWNlcy9yZW5kZXJlci9tYXJrZG93bi9tYXRoJztcbmltcG9ydCB7IFd4U2V0dGluZ3MgfSBmcm9tICcuLi9jb3JlL3NldHRpbmdzJztcbi8vIOenu+mZpERvY01vZGFs5a+85YWl77yM5LiN5YaN5L2/55So5by556qX5paH5qGjXG4vLyBpbXBvcnQgeyBEb2NNb2RhbCB9IGZyb20gJy4vZG9jLW1vZGFsJztcblxuZXhwb3J0IGNsYXNzIFd4U2V0dGluZ1RhYiBleHRlbmRzIFBsdWdpblNldHRpbmdUYWIge1xuXHRwbHVnaW46IFd4RWRpdFBsdWdpbjtcblx0d3hJbmZvOiBzdHJpbmc7XG5cdHd4VGV4dEFyZWE6IFRleHRBcmVhQ29tcG9uZW50fG51bGw7XG5cdHNldHRpbmdzOiBXeFNldHRpbmdzO1xuXG5cdGNvbnN0cnVjdG9yKGFwcDogQXBwLCBwbHVnaW46IFd4RWRpdFBsdWdpbikge1xuXHRcdHN1cGVyKGFwcCwgcGx1Z2luKTtcblx0XHR0aGlzLnBsdWdpbiA9IHBsdWdpbjtcblx0XHR0aGlzLnNldHRpbmdzID0gV3hTZXR0aW5ncy5nZXRJbnN0YW5jZSgpO1xuXHRcdHRoaXMud3hJbmZvID0gdGhpcy5wYXJzZVdYSW5mbygpO1xuXHR9XG5cblx0ZGlzcGxheVdYSW5mbyh0eHQ6c3RyaW5nKSB7XG5cdCAgICB0aGlzLnd4VGV4dEFyZWE/LnNldFZhbHVlKHR4dCk7XG5cdH1cblxuXHRwYXJzZVdYSW5mbygpIHtcblx0ICAgIGNvbnN0IHd4SW5mbyA9IHRoaXMuc2V0dGluZ3Mud3hJbmZvO1xuXHRcdGlmICh3eEluZm8ubGVuZ3RoID09IDApIHtcblx0XHRcdHJldHVybiAnJztcblx0XHR9XG5cblx0XHRsZXQgcmVzID0gJyc7XG5cdFx0Zm9yIChsZXQgd3ggb2Ygd3hJbmZvKSB7XG5cdFx0ICAgIHJlcyArPSBgJHt3eC5uYW1lfXwke3d4LmFwcGlkfXwqKioqKioqKlxcbmA7XG5cdFx0fVxuXHRcdHJldHVybiByZXM7XG5cdH1cblxuXHRhc3luYyB0ZXN0V1hJbmZvKCkge1xuXHRcdC8vIENsYXVkZSBDb2RlIFJlbW92ZTog56e76ZmkYXV0aEtleeWPmOmHj++8jOS4jeWGjemcgOimgeazqOWGjOeggemqjOivgVxuXHQgICAgY29uc3Qgd3hJbmZvID0gdGhpcy5zZXR0aW5ncy53eEluZm87XG5cdFx0aWYgKHd4SW5mby5sZW5ndGggPT0gMCkge1xuXHRcdCAgICBuZXcgTm90aWNlKCfor7flhYjorr7nva7lhazkvJflj7fkv6Hmga8nKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0dHJ5IHtcblx0XHRcdC8vIOenu+mZpOS4jeWGjeS9v+eUqOeahGRvY1VybOWPmOmHj1xuXHRcdFx0Ly8gQ2xhdWRlIENvZGUgVXBkYXRlXG5cdFx0XHRmb3IgKGxldCB3eCBvZiB3eEluZm8pIHtcblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRjb25zdCB0b2tlbkluZm8gPSBhd2FpdCB3eEdldFRva2VuKHd4LmFwcGlkLCB3eC5zZWNyZXQpO1xuXHRcdFx0XHRcdGlmICh0b2tlbkluZm8uYWNjZXNzX3Rva2VuICYmIHRva2VuSW5mby5hY2Nlc3NfdG9rZW4ubGVuZ3RoID4gMCkge1xuXHRcdFx0XHRcdFx0bmV3IE5vdGljZShgJHt3eC5uYW1lfSDmtYvor5XpgJrov4dgKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0bmV3IE5vdGljZShgJHt3eC5uYW1lfSDmtYvor5XlpLHotKXvvJrmnKrojrflj5bliLDmnInmlYh0b2tlbmApO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdFx0XHQvLyDnroDljJbplJnor6/mj5DnpLrvvIzkuI52MueJiOacrOS/neaMgeS4gOiHtO+8jOWPquS9v+eUqE5vdGljZe+8jOW5tuaYvuekuuW9k+WJjUlQXG5cdFx0XHRcdFx0bGV0IG1lc3NhZ2UgPSBgJHt3eC5uYW1lfSDmtYvor5XlpLHotKXvvJoke2Vycm9yLm1lc3NhZ2UgfHwgZXJyb3J9YDtcblx0XHRcdFx0XHRpZiAoZXJyb3IubWVzc2FnZSAmJiBlcnJvci5tZXNzYWdlLmluY2x1ZGVzKCc0MDEyNScpKSB7XG5cdFx0XHRcdFx0XHRtZXNzYWdlID0gYCR7d3gubmFtZX0g5rWL6K+V5aSx6LSl77yaQXBwU2VjcmV05peg5pWIICjplJnor6/noIE0MDEyNSnjgILor7fmo4Dmn6XvvJpcXG4xLiBBcHBTZWNyZXTmmK/lkKbmraPnoa7vvIjplb/luqblupTkuLozMuS9je+8iVxcbjIuIOaYr+WQpuS9v+eUqOS6hua1i+ivleWPt+eahEFwcFNlY3JldOS9humFjee9ruS6huato+W8j+WPt+eahEFwcElEXFxuMy4gQXBwU2VjcmV05piv5ZCm5bey6L+H5pyf5oiW6KKr6YeN572uXFxuNC4g5YWs5LyX5Y+357G75Z6L5piv5ZCm5pSv5oyB5q2kQVBJYDtcblx0XHRcdFx0XHR9IGVsc2UgaWYgKGVycm9yLm1lc3NhZ2UgJiYgKGVycm9yLm1lc3NhZ2UuaW5jbHVkZXMoJzQwMTY0JykgfHwgZXJyb3IubWVzc2FnZS5pbmNsdWRlcygnSVAnKSB8fCBlcnJvci5tZXNzYWdlLmluY2x1ZGVzKCd3aGl0ZWxpc3QnKSkpIHtcblx0XHRcdFx0XHRcdC8vIOS7jumUmeivr+a2iOaBr+S4reaPkOWPlklQ5Zyw5Z2A77yM5pSv5oyB5aSa56eN5qC85byPXG5cdFx0XHRcdFx0XHRsZXQgY3VycmVudElQID0gJ+acquefpSc7XG5cdFx0XHRcdFx0XHQvLyDljLnphY3moLzlvI/vvJppbnZhbGlkIGlwIDIyMy44Ny4yMTguOTgg5oiWIElQIDIyMy44Ny4yMTguOThcblx0XHRcdFx0XHRcdGNvbnN0IGlwTWF0Y2ggPSBlcnJvci5tZXNzYWdlLm1hdGNoKC8oPzppbnZhbGlkIGlwfElQKVs6XFxzXSsoXFxkK1xcLlxcZCtcXC5cXGQrXFwuXFxkKykvaSk7XG5cdFx0XHRcdFx0XHRpZiAoaXBNYXRjaCkge1xuXHRcdFx0XHRcdFx0XHRjdXJyZW50SVAgPSBpcE1hdGNoWzFdO1xuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0Ly8g5Yy56YWN57qvSVDlnLDlnYDmoLzlvI9cblx0XHRcdFx0XHRcdFx0Y29uc3QgcHVyZUlwTWF0Y2ggPSBlcnJvci5tZXNzYWdlLm1hdGNoKC8oXFxkK1xcLlxcZCtcXC5cXGQrXFwuXFxkKykvKTtcblx0XHRcdFx0XHRcdFx0aWYgKHB1cmVJcE1hdGNoKSB7XG5cdFx0XHRcdFx0XHRcdFx0Y3VycmVudElQID0gcHVyZUlwTWF0Y2hbMV07XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdG1lc3NhZ2UgPSBgJHt3eC5uYW1lfSDmtYvor5XlpLHotKXvvJpJUOWcsOWdgCAke2N1cnJlbnRJUH0g5LiN5Zyo55m95ZCN5Y2V5Lit77yM6K+35bCG5q2kSVDmt7vliqDliLDlvq7kv6HlhazkvJflubPlj7Dnmb3lkI3ljZVgO1xuXHRcdFx0XHRcdH0gZWxzZSBpZiAoZXJyb3IubWVzc2FnZSAmJiBlcnJvci5tZXNzYWdlLmluY2x1ZGVzKCc1MDAwMicpKSB7XG5cdFx0XHRcdFx0XHRtZXNzYWdlID0gYCR7d3gubmFtZX0g5rWL6K+V5aSx6LSl77ya55So5oi35Y+X6ZmQ77yM5Y+v6IO95piv5YWs5LyX5Y+36KKr5Ya757uTYDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0bmV3IE5vdGljZShtZXNzYWdlKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRuZXcgTm90aWNlKGDmtYvor5XlpLHotKXvvJoke2Vycm9yfWApO1xuXHRcdH1cblx0fVxuXG5cdC8vIOmHh+eUqHYy54mI5pys55u05o6l5L+d5a2Y5pa55byP77yM5LiN5YaN5Yqg5a+GXG5cdC8vIENsYXVkZSBDb2RlIFVwZGF0ZTog5aKe5YqgYXV0aEtleeWPguaVsFxuXHRhc3luYyBzYXZlV1hJbmZvKGF1dGhLZXk/OiBzdHJpbmcpIHtcblx0ICAgIGlmICh0aGlzLnd4SW5mby5sZW5ndGggPT0gMCkge1xuXHRcdFx0bmV3IE5vdGljZSgn6K+36L6T5YWl5YaF5a65Jyk7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0aWYgKHRoaXMuc2V0dGluZ3Mud3hJbmZvLmxlbmd0aCA+IDApIHtcblx0XHQgICAgbmV3IE5vdGljZSgn5bey57uP5L+d5a2Y6L+H5LqG77yM6K+35YWI5riF6Zmk77yBJyk7XG5cdFx0ICAgIHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHQvLyBDbGF1ZGUgQ29kZSBBREQ6IOmqjOivgWF1dGhLZXlcblx0XHRpZiAoIWF1dGhLZXkgfHwgYXV0aEtleS50cmltKCkubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRuZXcgTm90aWNlKCfor7flhYjpqozor4FBdXRoS2V5Jyk7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Y29uc3Qgd2VjaGF0ID0gW107XG5cdFx0Y29uc3QgbGluZXMgPSB0aGlzLnd4SW5mby5zcGxpdCgnXFxuJyk7XG5cdFx0Zm9yIChsZXQgbGluZSBvZiBsaW5lcykge1xuXHRcdFx0bGluZSA9IGxpbmUudHJpbSgpO1xuXHRcdFx0aWYgKGxpbmUubGVuZ3RoID09IDApIHtcblx0XHRcdCAgICBjb250aW51ZTtcblx0XHRcdH1cblx0XHRcdGNvbnN0IGl0ZW1zID0gbGluZS5zcGxpdCgnfCcpO1xuXHRcdFx0aWYgKGl0ZW1zLmxlbmd0aCAhPSAzKSB7XG5cdFx0XHRcdG5ldyBOb3RpY2UoJ+agvOW8j+mUmeivr++8jOivt+ajgOafpScpO1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cdFx0XHQvLyDnoa7kv53miYDmnInlrZfmrrXpg73ooqvmraPnoa50cmlt5aSE55CGXG5cdFx0XHRjb25zdCBuYW1lID0gaXRlbXNbMF0udHJpbSgpO1xuXHRcdFx0Y29uc3QgYXBwaWQgPSBpdGVtc1sxXS50cmltKCk7XG5cdFx0XHRjb25zdCBzZWNyZXQgPSBpdGVtc1syXS50cmltKCk7XG5cblx0XHRcdHdlY2hhdC5wdXNoKHtuYW1lLCBhcHBpZCwgc2VjcmV0fSk7XG5cdFx0fVxuXG5cdFx0aWYgKHdlY2hhdC5sZW5ndGggPT0gMCkge1xuXHRcdCAgICByZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0dHJ5IHtcblx0XHRcdC8vIENsYXVkZSBDb2RlIEFERDog5YWI5ZCM5q2l5Yiw5ZCO56uv5pWw5o2u5bqTXG5cdFx0XHRjb25zdCB7IGdldFdlY2hhdENsaWVudCB9ID0gYXdhaXQgaW1wb3J0KCcuLi9zZXJ2aWNlcy9hcGknKTtcblx0XHRcdGNvbnN0IHdlY2hhdENsaWVudCA9IGdldFdlY2hhdENsaWVudCgpO1xuXG5cdFx0XHRmb3IgKGxldCB3eCBvZiB3ZWNoYXQpIHtcblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRhd2FpdCB3ZWNoYXRDbGllbnQucmVnaXN0ZXJBY2NvdW50KHtcblx0XHRcdFx0XHRcdGFwcF9pZDogd3guYXBwaWQsXG5cdFx0XHRcdFx0XHRhcHBfc2VjcmV0OiB3eC5zZWNyZXQsXG5cdFx0XHRcdFx0XHRuYW1lOiB3eC5uYW1lLFxuXHRcdFx0XHRcdFx0YXV0aF9rZXk6IGF1dGhLZXkudHJpbSgpXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRcdFx0Ly8gQ2xhdWRlIENvZGUgVXBkYXRlOiDlkIzmraXlpLHotKXml7bpmLvmraLkv53lrZhcblx0XHRcdFx0XHRuZXcgTm90aWNlKGDlkIzmraXlhazkvJflj7cgJHt3eC5uYW1lfSDliLDlkI7nq6/lpLHotKU6ICR7ZXJyb3IubWVzc2FnZSB8fCBlcnJvcn1gKTtcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0Ly8g55u05o6l5L+d5a2Y5b6u5L+h5L+h5oGv77yM5LiN5YaN5Yqg5a+GXG5cdFx0XHR0aGlzLnNldHRpbmdzLnd4SW5mbyA9IHdlY2hhdDtcblx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0dGhpcy53eEluZm8gPSB0aGlzLnBhcnNlV1hJbmZvKCk7XG5cdFx0XHR0aGlzLmRpc3BsYXlXWEluZm8odGhpcy53eEluZm8pO1xuXHRcdFx0bmV3IE5vdGljZSgn5L+d5a2Y5oiQ5YqfJyk7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblxuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRuZXcgTm90aWNlKGDkv53lrZjlpLHotKXvvJoke2Vycm9yfWApO1xuXHRcdFx0Y29uc29sZS5lcnJvcihlcnJvcik7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0YXN5bmMgY2xlYXIoKSB7XG5cdFx0dGhpcy5zZXR0aW5ncy53eEluZm8gPSBbXTtcblx0XHRhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcblx0XHR0aGlzLnd4SW5mbyA9ICcnO1xuXHRcdHRoaXMuZGlzcGxheVdYSW5mbygnJylcblx0fVxuXG5cdC8vIENsYXVkZSBDb2RlIFVwZGF0ZTog6YeN5p6EZGlzcGxheeaWueazle+8jOiwg+aVtOiuvue9rumhuuW6j+W5tua3u+WKoOaWsOiuvue9rumhuVxuXHRkaXNwbGF5KCkge1xuXHRcdGNvbnN0IHtjb250YWluZXJFbH0gPSB0aGlzO1xuXG5cdFx0Y29udGFpbmVyRWwuZW1wdHkoKTtcblxuXHRcdHRoaXMud3hJbmZvID0gdGhpcy5wYXJzZVdYSW5mbygpO1xuXG5cdFx0Y29uc3QgaGVscEVsID0gY29udGFpbmVyRWwuY3JlYXRlRWwoJ2RpdicpO1xuXHRcdGhlbHBFbC5zdHlsZS5jc3NUZXh0ID0gJ2Rpc3BsYXk6IGZsZXg7ZmxleC1kaXJlY3Rpb246IHJvdzthbGlnbi1pdGVtczogY2VudGVyOyc7XG5cdFx0aGVscEVsLmNyZWF0ZUVsKCdoMicsIHt0ZXh0OiAn5biu5Yqp5paH5qGjJ30pLnN0eWxlLmNzc1RleHQgPSAnbWFyZ2luLXJpZ2h0OiAxMHB4Oyc7XG5cdFx0aGVscEVsLmNyZWF0ZUVsKCdhJywge3RleHQ6ICdodHRwczovL2dpdGh1Yi5jb20vSXNIZXh4L1dEV1hFZGl0JywgYXR0cjoge2hyZWY6ICdodHRwczovL2dpdGh1Yi5jb20vSXNIZXh4L1dEV1hFZGl0J319KTtcblxuXHRcdC8vID09PT09PT09PT09PT09PT09PT09IOS4u+mimOS4juagt+W8j+iuvue9riA9PT09PT09PT09PT09PT09PT09PVxuXHRcdGNvbnRhaW5lckVsLmNyZWF0ZUVsKCdoMicsIHt0ZXh0OiAn5Li76aKY5LiO5qC35byPJ30pO1xuXG5cdFx0bmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG5cdFx0XHQuc2V0TmFtZSgn6buY6K6k5qC35byPJylcblx0XHRcdC5hZGREcm9wZG93bihkcm9wZG93biA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3R5bGVzID0gdGhpcy5wbHVnaW4uYXNzZXRzTWFuYWdlci50aGVtZXM7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgcyBvZiBzdHlsZXMpIHtcblx0XHRcdFx0ICAgIGRyb3Bkb3duLmFkZE9wdGlvbihzLmNsYXNzTmFtZSwgcy5uYW1lKTtcbiAgICAgICAgICAgICAgICB9XG5cdFx0XHRcdGRyb3Bkb3duLnNldFZhbHVlKHRoaXMuc2V0dGluZ3MuZGVmYXVsdFN0eWxlKTtcbiAgICAgICAgICAgICAgICBkcm9wZG93bi5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcblx0XHRcdFx0XHR0aGlzLnNldHRpbmdzLmRlZmF1bHRTdHlsZSA9IHZhbHVlO1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgICAgICAgIH0pO1xuXHRcdFx0fSk7XG5cblx0XHRuZXcgU2V0dGluZyhjb250YWluZXJFbClcblx0XHRcdC5zZXROYW1lKCfku6PnoIHpq5jkuq4nKVxuXHRcdFx0LmFkZERyb3Bkb3duKGRyb3Bkb3duID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBzdHlsZXMgPSB0aGlzLnBsdWdpbi5hc3NldHNNYW5hZ2VyLmhpZ2hsaWdodHM7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgcyBvZiBzdHlsZXMpIHtcblx0XHRcdFx0ICAgIGRyb3Bkb3duLmFkZE9wdGlvbihzLm5hbWUsIHMubmFtZSk7XG4gICAgICAgICAgICAgICAgfVxuXHRcdFx0XHRkcm9wZG93bi5zZXRWYWx1ZSh0aGlzLnNldHRpbmdzLmRlZmF1bHRIaWdobGlnaHQpO1xuICAgICAgICAgICAgICAgIGRyb3Bkb3duLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuXHRcdFx0XHRcdHRoaXMuc2V0dGluZ3MuZGVmYXVsdEhpZ2hsaWdodCA9IHZhbHVlO1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgICAgICAgIH0pO1xuXHRcdFx0fSk7XG5cblx0XHRuZXcgU2V0dGluZyhjb250YWluZXJFbClcblx0XHRcdC5zZXROYW1lKCfojrflj5bmm7TlpJrkuLvpopgnKVxuXHRcdFx0LmFkZEJ1dHRvbihidXR0b24gPT4ge1xuXHRcdFx0ICAgIGJ1dHRvbi5zZXRCdXR0b25UZXh0KCfkuIvovb0nKTtcblx0XHRcdFx0YnV0dG9uLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuXHRcdFx0XHRcdGJ1dHRvbi5zZXRCdXR0b25UZXh0KCfkuIvovb3kuK0uLi4nKTtcblx0XHRcdFx0XHRhd2FpdCB0aGlzLnBsdWdpbi5hc3NldHNNYW5hZ2VyLmRvd25sb2FkVGhlbWVzKCk7XG5cdFx0XHRcdFx0YnV0dG9uLnNldEJ1dHRvblRleHQoJ+S4i+i9veWujOaIkCcpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pXG5cdFx0XHQuYWRkQnV0dG9uKGJ1dHRvbiA9PiB7XG5cdFx0XHRcdGJ1dHRvbi5zZXRJY29uKCdmb2xkZXItb3BlbicpO1xuXHRcdFx0XHRidXR0b24ub25DbGljayhhc3luYyAoKSA9PiB7XG5cdFx0XHRcdFx0YXdhaXQgdGhpcy5wbHVnaW4uYXNzZXRzTWFuYWdlci5vcGVuQXNzZXRzKCk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cblx0XHRuZXcgU2V0dGluZyhjb250YWluZXJFbClcblx0XHRcdC5zZXROYW1lKCfmuIXnqbrkuLvpopgnKVxuXHRcdFx0LmFkZEJ1dHRvbihidXR0b24gPT4ge1xuXHRcdFx0ICAgIGJ1dHRvbi5zZXRCdXR0b25UZXh0KCfmuIXnqbonKTtcblx0XHRcdFx0YnV0dG9uLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLmFzc2V0c01hbmFnZXIucmVtb3ZlVGhlbWVzKCk7XG5cdFx0XHRcdFx0dGhpcy5zZXR0aW5ncy5yZXNldFN0eWVsQW5kSGlnaGxpZ2h0KCk7XG5cdFx0XHRcdFx0YXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cblx0XHRuZXcgU2V0dGluZyhjb250YWluZXJFbClcblx0XHRcdC5zZXROYW1lKCflnKjlt6XlhbfmoI/lsZXnpLrmoLflvI/pgInmi6knKVxuXHRcdFx0LnNldERlc2MoJ+W7uuiuruWcqOenu+WKqOerr+WFs+mXre+8jOWPr+S7peWinuWkp+aWh+eroOmihOiniOWMuuWfnycpXG5cdFx0XHQuYWRkVG9nZ2xlKHRvZ2dsZSA9PiB7XG5cdFx0XHQgICAgdG9nZ2xlLnNldFZhbHVlKHRoaXMuc2V0dGluZ3Muc2hvd1N0eWxlVUkpO1xuXHRcdFx0XHR0b2dnbGUub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG5cdFx0XHRcdCAgICB0aGlzLnNldHRpbmdzLnNob3dTdHlsZVVJID0gdmFsdWU7XG5cdFx0XHRcdFx0YXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cblx0XHQvLyBDbGF1ZGUgQ29kZSBBREQ6IOaWsOWinuagt+W8j+e8lui+keWZqOiuvue9rlxuXHRcdG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuXHRcdFx0LnNldE5hbWUoJ+Wtl+S9kycpXG5cdFx0XHQuc2V0RGVzYygn6K6+572u5paH56ug5a2X5L2TJylcblx0XHRcdC5hZGREcm9wZG93bihkcm9wZG93biA9PiB7XG5cdFx0XHRcdGRyb3Bkb3duLmFkZE9wdGlvbign562J57q/JywgJ+etiee6vycpO1xuXHRcdFx0XHRkcm9wZG93bi5hZGRPcHRpb24oJ+Wui+S9kycsICflrovkvZMnKTtcblx0XHRcdFx0ZHJvcGRvd24uYWRkT3B0aW9uKCfpu5HkvZMnLCAn6buR5L2TJyk7XG5cdFx0XHRcdGRyb3Bkb3duLmFkZE9wdGlvbign5b6u6L2v6ZuF6buRJywgJ+W+rui9r+mbhem7kScpO1xuXHRcdFx0XHRkcm9wZG93bi5hZGRPcHRpb24oJ+alt+S9kycsICfmpbfkvZMnKTtcblx0XHRcdFx0ZHJvcGRvd24uc2V0VmFsdWUodGhpcy5zZXR0aW5ncy5mb250RmFtaWx5KTtcblx0XHRcdFx0ZHJvcGRvd24ub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5zZXR0aW5ncy5mb250RmFtaWx5ID0gdmFsdWU7XG5cdFx0XHRcdFx0YXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cblx0XHRuZXcgU2V0dGluZyhjb250YWluZXJFbClcblx0XHRcdC5zZXROYW1lKCflrZflj7cnKVxuXHRcdFx0LnNldERlc2MoJ+iuvue9ruaWh+eroOWtl+WPtycpXG5cdFx0XHQuYWRkRHJvcGRvd24oZHJvcGRvd24gPT4ge1xuXHRcdFx0XHRkcm9wZG93bi5hZGRPcHRpb24oJ+i+g+WwjycsICfovoPlsI8nKTtcblx0XHRcdFx0ZHJvcGRvd24uYWRkT3B0aW9uKCfmjqjojZAnLCAn5o6o6I2QJyk7XG5cdFx0XHRcdGRyb3Bkb3duLmFkZE9wdGlvbign6L6D5aSnJywgJ+i+g+WkpycpO1xuXHRcdFx0XHRkcm9wZG93bi5zZXRWYWx1ZSh0aGlzLnNldHRpbmdzLmZvbnRTaXplKTtcblx0XHRcdFx0ZHJvcGRvd24ub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5zZXR0aW5ncy5mb250U2l6ZSA9IHZhbHVlO1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXG5cdFx0bmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG5cdFx0XHQuc2V0TmFtZSgn5Li76aKY6ImyJylcblx0XHRcdC5zZXREZXNjKCforr7nva7mlofnq6DkuLvpopjoibInKVxuXHRcdFx0LmFkZFRleHQodGV4dCA9PiB7XG5cdFx0XHRcdHRleHQuc2V0UGxhY2Vob2xkZXIoJyMyZDM3NDgnKVxuXHRcdFx0XHRcdC5zZXRWYWx1ZSh0aGlzLnNldHRpbmdzLnByaW1hcnlDb2xvcilcblx0XHRcdFx0XHQub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG5cdFx0XHRcdFx0XHR0aGlzLnNldHRpbmdzLnByaW1hcnlDb2xvciA9IHZhbHVlLnRyaW0oKTtcblx0XHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0LmlucHV0RWwuc2V0QXR0cignc3R5bGUnLCAnd2lkdGg6IDEyMHB4OycpXG5cdFx0XHR9KTtcblxuXHRcdC8vID09PT09PT09PT09PT09PT09PT09IOWGheWuuea4suafk+iuvue9riA9PT09PT09PT09PT09PT09PT09PVxuXHRcdGNvbnRhaW5lckVsLmNyZWF0ZUVsKCdoMicsIHt0ZXh0OiAn5YaF5a655riy5p+TJ30pO1xuXG5cdFx0bmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG5cdFx0XHQuc2V0TmFtZSgn6ZO+5o6l5bGV56S65qC35byPJylcblx0XHRcdC5hZGREcm9wZG93bihkcm9wZG93biA9PiB7XG5cdFx0XHRcdGRyb3Bkb3duLmFkZE9wdGlvbignaW5saW5lJywgJ+WGheW1jCcpO1xuXHRcdFx0ICAgIGRyb3Bkb3duLmFkZE9wdGlvbignZm9vdG5vdGUnLCAn6ISa5rOoJyk7XG5cdFx0XHRcdGRyb3Bkb3duLnNldFZhbHVlKHRoaXMuc2V0dGluZ3MubGlua1N0eWxlKTtcblx0XHRcdFx0ZHJvcGRvd24ub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG5cdFx0XHRcdCAgICB0aGlzLnNldHRpbmdzLmxpbmtTdHlsZSA9IHZhbHVlO1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXG5cdFx0bmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG5cdFx0XHQuc2V0TmFtZSgn5paH5Lu25bWM5YWl5bGV56S65qC35byPJylcblx0XHRcdC5hZGREcm9wZG93bihkcm9wZG93biA9PiB7XG5cdFx0XHRcdGRyb3Bkb3duLmFkZE9wdGlvbigncXVvdGUnLCAn5byV55SoJyk7XG5cdFx0XHQgICAgZHJvcGRvd24uYWRkT3B0aW9uKCdjb250ZW50JywgJ+ato+aWhycpO1xuXHRcdFx0XHRkcm9wZG93bi5zZXRWYWx1ZSh0aGlzLnNldHRpbmdzLmVtYmVkU3R5bGUpO1xuXHRcdFx0XHRkcm9wZG93bi5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcblx0XHRcdFx0ICAgIHRoaXMuc2V0dGluZ3MuZW1iZWRTdHlsZSA9IHZhbHVlO1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXG5cdFx0bmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG5cdFx0XHQuc2V0TmFtZSgn5pWw5a2m5YWs5byP6K+t5rOVJylcblx0XHRcdC5hZGREcm9wZG93bihkcm9wZG93biA9PiB7XG5cdFx0XHRcdGRyb3Bkb3duLmFkZE9wdGlvbignbGF0ZXgnLCAnbGF0ZXgnKTtcblx0XHRcdCAgICBkcm9wZG93bi5hZGRPcHRpb24oJ2FzY2lpbWF0aCcsICdhc2NpaW1hdGgnKTtcblx0XHRcdFx0ZHJvcGRvd24uc2V0VmFsdWUodGhpcy5zZXR0aW5ncy5tYXRoKTtcblx0XHRcdFx0ZHJvcGRvd24ub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG5cdFx0XHRcdCAgICB0aGlzLnNldHRpbmdzLm1hdGggPSB2YWx1ZTtcblx0XHRcdFx0XHRjbGVhbk1hdGhDYWNoZSgpO1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXG5cdFx0bmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG5cdFx0XHQuc2V0TmFtZSgn5pi+56S65Luj56CB6KGM5Y+3Jylcblx0XHRcdC5hZGRUb2dnbGUodG9nZ2xlID0+IHtcblx0XHRcdCAgICB0b2dnbGUuc2V0VmFsdWUodGhpcy5zZXR0aW5ncy5saW5lTnVtYmVyKTtcblx0XHRcdFx0dG9nZ2xlLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuXHRcdFx0XHQgICAgdGhpcy5zZXR0aW5ncy5saW5lTnVtYmVyID0gdmFsdWU7XG5cdFx0XHRcdFx0YXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cblx0XHRuZXcgU2V0dGluZyhjb250YWluZXJFbClcblx0XHRcdC5zZXROYW1lKCflkK/nlKjnqbrooYzmuLLmn5MnKVxuXHRcdFx0LmFkZFRvZ2dsZSh0b2dnbGUgPT4ge1xuXHRcdFx0ICAgIHRvZ2dsZS5zZXRWYWx1ZSh0aGlzLnNldHRpbmdzLmVuYWJsZUVtcHR5TGluZSk7XG5cdFx0XHRcdHRvZ2dsZS5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcblx0XHRcdFx0ICAgIHRoaXMuc2V0dGluZ3MuZW5hYmxlRW1wdHlMaW5lID0gdmFsdWU7XG5cdFx0XHRcdFx0YXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cblx0XHRuZXcgU2V0dGluZyhjb250YWluZXJFbClcblx0XHRcdC5zZXROYW1lKCfmuLLmn5Plm77niYfmoIfpopgnKVxuXHRcdFx0LmFkZFRvZ2dsZSh0b2dnbGUgPT4ge1xuXHRcdFx0XHR0b2dnbGUuc2V0VmFsdWUodGhpcy5zZXR0aW5ncy51c2VGaWdjYXB0aW9uKTtcblx0XHRcdFx0dG9nZ2xlLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuXHRcdFx0XHRcdHRoaXMuc2V0dGluZ3MudXNlRmlnY2FwdGlvbiA9IHZhbHVlO1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXG5cdFx0Ly8gPT09PT09PT09PT09PT09PT09PT0g5o6S54mI6K6+572uID09PT09PT09PT09PT09PT09PT09XG5cdFx0Y29udGFpbmVyRWwuY3JlYXRlRWwoJ2gyJywge3RleHQ6ICfmjpLniYjorr7nva4nfSk7XG5cblx0XHQvLyBDbGF1ZGUgQ29kZSBBREQ6IOaWsOWinuaOkueJiOiuvue9rlxuXHRcdG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuXHRcdFx0LnNldE5hbWUoJ+auteiQvemXtOi3nScpXG5cdFx0XHQuYWRkRHJvcGRvd24oZHJvcGRvd24gPT4ge1xuXHRcdFx0XHRkcm9wZG93bi5hZGRPcHRpb24oJ+e0p+WHkScsICfntKflh5EnKTtcblx0XHRcdFx0ZHJvcGRvd24uYWRkT3B0aW9uKCfmraPluLgnLCAn5q2j5bi4Jyk7XG5cdFx0XHRcdGRyb3Bkb3duLmFkZE9wdGlvbign5a695p2+JywgJ+WuveadvicpO1xuXHRcdFx0XHRkcm9wZG93bi5zZXRWYWx1ZSh0aGlzLnNldHRpbmdzLnBhcmFncmFwaFNwYWNpbmcpO1xuXHRcdFx0XHRkcm9wZG93bi5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcblx0XHRcdFx0XHR0aGlzLnNldHRpbmdzLnBhcmFncmFwaFNwYWNpbmcgPSB2YWx1ZTtcblx0XHRcdFx0XHRhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblxuXHRcdG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuXHRcdFx0LnNldE5hbWUoJ+mmluihjOe8qei/mycpXG5cdFx0XHQuc2V0RGVzYygn5q616JC96aaW6KGM5piv5ZCm57yp6L+b5Lik5Liq5a2X56ymJylcblx0XHRcdC5hZGRUb2dnbGUodG9nZ2xlID0+IHtcblx0XHRcdFx0dG9nZ2xlLnNldFZhbHVlKHRoaXMuc2V0dGluZ3MuZmlyc3RMaW5lSW5kZW50KTtcblx0XHRcdFx0dG9nZ2xlLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuXHRcdFx0XHRcdHRoaXMuc2V0dGluZ3MuZmlyc3RMaW5lSW5kZW50ID0gdmFsdWU7XG5cdFx0XHRcdFx0YXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cblx0XHRuZXcgU2V0dGluZyhjb250YWluZXJFbClcblx0XHRcdC5zZXROYW1lKCfmoIfpopjlr7npvZAnKVxuXHRcdFx0LmFkZERyb3Bkb3duKGRyb3Bkb3duID0+IHtcblx0XHRcdFx0ZHJvcGRvd24uYWRkT3B0aW9uKCdsZWZ0JywgJ+W3puWvuem9kCcpO1xuXHRcdFx0XHRkcm9wZG93bi5hZGRPcHRpb24oJ2NlbnRlcicsICflsYXkuK0nKTtcblx0XHRcdFx0ZHJvcGRvd24uc2V0VmFsdWUodGhpcy5zZXR0aW5ncy5oZWFkaW5nQWxpZ24pO1xuXHRcdFx0XHRkcm9wZG93bi5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcblx0XHRcdFx0XHR0aGlzLnNldHRpbmdzLmhlYWRpbmdBbGlnbiA9IHZhbHVlO1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXG5cblx0XHQvLyA9PT09PT09PT09PT09PT09PT09PSDlm77niYflpITnkIborr7nva4gPT09PT09PT09PT09PT09PT09PT1cblx0XHRjb250YWluZXJFbC5jcmVhdGVFbCgnaDInLCB7dGV4dDogJ+WbvueJh+WkhOeQhid9KTtcblxuXHRcdG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuXHRcdFx0LnNldE5hbWUoJ+awtOWNsOWbvueJhycpXG5cdFx0XHQuc2V0RGVzYygn6L6T5YWldmF1bHTkuK3nmoTlm77niYfmlofku7blkI0nKVxuXHRcdFx0LmFkZFRleHQodGV4dCA9PiB7XG5cdFx0XHQgICAgdGV4dC5zZXRQbGFjZWhvbGRlcign6K+36L6T5YWl5Zu+54mH5ZCN56ewJylcblx0XHRcdFx0XHQuc2V0VmFsdWUodGhpcy5zZXR0aW5ncy53YXRlcm1hcmspXG5cdFx0XHRcdFx0Lm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuXHRcdFx0XHRcdCAgdGhpcy5zZXR0aW5ncy53YXRlcm1hcmsgPSB2YWx1ZS50cmltKCk7XG5cdFx0XHRcdFx0XHRhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdC5pbnB1dEVsLnNldEF0dHIoJ3N0eWxlJywgJ3dpZHRoOiAzMjBweDsnKVxuXHRcdFx0fSk7XG5cblx0XHQvLyBDbGF1ZGUgQ29kZSBBREQ6IOaWsOWinuWbvueJh+WkhOeQhuiuvue9rlxuXHRcdG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuXHRcdFx0LnNldE5hbWUoJ+iHquWKqOWOi+e8qeWbvueJhycpXG5cdFx0XHQuc2V0RGVzYygn5LiK5Lyg5YmN6Ieq5Yqo5Y6L57yp5Zu+54mH5Lul5o+Q6auY5Yqg6L296YCf5bqmJylcblx0XHRcdC5hZGRUb2dnbGUodG9nZ2xlID0+IHtcblx0XHRcdFx0dG9nZ2xlLnNldFZhbHVlKHRoaXMuc2V0dGluZ3MuYXV0b0NvbXByZXNzSW1hZ2UpO1xuXHRcdFx0XHR0b2dnbGUub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5zZXR0aW5ncy5hdXRvQ29tcHJlc3NJbWFnZSA9IHZhbHVlO1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXG5cdFx0bmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG5cdFx0XHQuc2V0TmFtZSgn5Zu+54mH5Y6L57yp6LSo6YePJylcblx0XHRcdC5zZXREZXNjKCfljovnvKnotKjph4/vvIgwLjEtMS4w77yJ77yM5pWw5YC86LaK6auY6LSo6YeP6LaK5aW95L2G5paH5Lu26LaK5aSnJylcblx0XHRcdC5hZGRUZXh0KHRleHQgPT4ge1xuXHRcdFx0XHR0ZXh0LnNldFBsYWNlaG9sZGVyKCcwLjknKVxuXHRcdFx0XHRcdC5zZXRWYWx1ZShTdHJpbmcodGhpcy5zZXR0aW5ncy5pbWFnZVF1YWxpdHkpKVxuXHRcdFx0XHRcdC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcblx0XHRcdFx0XHRcdGNvbnN0IHF1YWxpdHkgPSBwYXJzZUZsb2F0KHZhbHVlKTtcblx0XHRcdFx0XHRcdGlmICghaXNOYU4ocXVhbGl0eSkgJiYgcXVhbGl0eSA+PSAwLjEgJiYgcXVhbGl0eSA8PSAxLjApIHtcblx0XHRcdFx0XHRcdFx0dGhpcy5zZXR0aW5ncy5pbWFnZVF1YWxpdHkgPSBxdWFsaXR5O1xuXHRcdFx0XHRcdFx0XHRhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdC5pbnB1dEVsLnNldEF0dHIoJ3N0eWxlJywgJ3dpZHRoOiAxMjBweDsnKVxuXHRcdFx0fSk7XG5cblx0XHRuZXcgU2V0dGluZyhjb250YWluZXJFbClcblx0XHRcdC5zZXROYW1lKCflm77niYfmnIDlpKflrr3luqYnKVxuXHRcdFx0LnNldERlc2MoJ+WbvueJh+acgOWkp+WuveW6pumZkOWItu+8iOWDj+e0oO+8iScpXG5cdFx0XHQuYWRkVGV4dCh0ZXh0ID0+IHtcblx0XHRcdFx0dGV4dC5zZXRQbGFjZWhvbGRlcignMTIwMCcpXG5cdFx0XHRcdFx0LnNldFZhbHVlKFN0cmluZyh0aGlzLnNldHRpbmdzLmltYWdlTWF4V2lkdGgpKVxuXHRcdFx0XHRcdC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcblx0XHRcdFx0XHRcdGNvbnN0IHdpZHRoID0gcGFyc2VJbnQodmFsdWUpO1xuXHRcdFx0XHRcdFx0aWYgKCFpc05hTih3aWR0aCkgJiYgd2lkdGggPiAwKSB7XG5cdFx0XHRcdFx0XHRcdHRoaXMuc2V0dGluZ3MuaW1hZ2VNYXhXaWR0aCA9IHdpZHRoO1xuXHRcdFx0XHRcdFx0XHRhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdC5pbnB1dEVsLnNldEF0dHIoJ3N0eWxlJywgJ3dpZHRoOiAxMjBweDsnKVxuXHRcdFx0fSk7XG5cblx0XHQvLyA9PT09PT09PT09PT09PT09PT09PSDoh6rlrprkuYnmoLflvI8gPT09PT09PT09PT09PT09PT09PT1cblx0XHRjb250YWluZXJFbC5jcmVhdGVFbCgnaDInLCB7dGV4dDogJ+iHquWumuS5ieagt+W8jyd9KTtcblxuXHRcdG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuXHRcdFx0LnNldE5hbWUoJ+WFqOWxgENTU+WxnuaApycpXG5cdFx0XHQuc2V0RGVzYygn5Y+q6IO95aGr5YaZQ1NT5bGe5oCn77yM5LiN6IO95YaZ6YCJ5oup5ZmoJylcblx0XHRcdC5hZGRUZXh0QXJlYSh0ZXh0ID0+IHtcblx0XHRcdFx0dGhpcy53eFRleHRBcmVhID0gdGV4dDtcblx0XHRcdCAgICB0ZXh0LnNldFBsYWNlaG9sZGVyKCfor7fovpPlhaVDU1PlsZ7mgKfvvIzlpoLvvJpiYWNrZ3JvdW5kOiAjZmZmO3BhZGRpbmc6IDEwcHg7Jylcblx0XHRcdFx0ICAgIC5zZXRWYWx1ZSh0aGlzLnNldHRpbmdzLmJhc2VDU1MpXG5cdFx0XHRcdFx0Lm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuXHRcdFx0XHRcdCAgICB0aGlzLnNldHRpbmdzLmJhc2VDU1MgPSB2YWx1ZTtcblx0XHRcdFx0XHRcdFx0YXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0ICAgIC5pbnB1dEVsLnNldEF0dHIoJ3N0eWxlJywgJ3dpZHRoOiA1MjBweDsgaGVpZ2h0OiA2MHB4OycpO1xuXHRcdH0pO1xuXG5cdFx0Y29uc3QgY3VzdG9tQ1NTRG9jID0gJ+S9v+eUqOaMh+WNl++8mjxhIGhyZWY9XCJodHRwczovL2dpdGh1Yi5jb20vSXNIZXh4L1dEV1hFZGl0XCI+aHR0cHM6Ly9naXRodWIuY29tL0lzSGV4eC9XRFdYRWRpdDwvYT4nO1xuXHRcdG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuXHRcdFx0LnNldE5hbWUoJ+iHquWumuS5iUNTU+eslOiusCcpXG5cdFx0XHQuc2V0RGVzYyhzYW5pdGl6ZUhUTUxUb0RvbShjdXN0b21DU1NEb2MpKVxuXHRcdFx0LmFkZFRleHQodGV4dCA9PiB7XG5cdFx0XHRcdHRleHQuc2V0UGxhY2Vob2xkZXIoJ+ivt+i+k+WFpeiHquWumuS5iUNTU+eslOiusOagh+mimCcpXG5cdFx0XHRcdC5zZXRWYWx1ZSh0aGlzLnNldHRpbmdzLmN1c3RvbUNTU05vdGUpXG5cdFx0XHRcdC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcblx0XHRcdFx0XHR0aGlzLnNldHRpbmdzLmN1c3RvbUNTU05vdGUgPSB2YWx1ZS50cmltKCk7XG5cdFx0XHRcdFx0YXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG5cdFx0XHRcdFx0YXdhaXQgdGhpcy5wbHVnaW4uYXNzZXRzTWFuYWdlci5sb2FkQ3VzdG9tQ1NTKCk7XG5cdFx0XHRcdH0pXG5cdFx0XHRcdC5pbnB1dEVsLnNldEF0dHIoJ3N0eWxlJywgJ3dpZHRoOiAzMjBweDsnKVxuXHRcdH0pO1xuXG5cdFx0Ly8gPT09PT09PT09PT09PT09PT09PT0g5a+85Ye66K6+572uID09PT09PT09PT09PT09PT09PT09XG5cdFx0Y29udGFpbmVyRWwuY3JlYXRlRWwoJ2gyJywge3RleHQ6ICflr7zlh7rorr7nva4nfSk7XG5cblx0XHQvLyBDbGF1ZGUgQ29kZSBBREQ6IOaWsOWinuWvvOWHuuiuvue9rlxuXHRcdG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuXHRcdFx0LnNldE5hbWUoJ+m7mOiupOWvvOWHuuagvOW8jycpXG5cdFx0XHQuYWRkRHJvcGRvd24oZHJvcGRvd24gPT4ge1xuXHRcdFx0XHRkcm9wZG93bi5hZGRPcHRpb24oJ2NvcHknLCAn5aSN5Yi25Yiw5Ymq6LS05p2/Jyk7XG5cdFx0XHRcdGRyb3Bkb3duLmFkZE9wdGlvbignZHJhZnQnLCAn5L+d5a2Y5Li66I2J56i/Jyk7XG5cdFx0XHRcdGRyb3Bkb3duLmFkZE9wdGlvbignaW1hZ2UnLCAn5a+85Ye65Li65Zu+54mHJyk7XG5cdFx0XHRcdGRyb3Bkb3duLnNldFZhbHVlKHRoaXMuc2V0dGluZ3MuZGVmYXVsdEV4cG9ydEZvcm1hdCk7XG5cdFx0XHRcdGRyb3Bkb3duLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuXHRcdFx0XHRcdHRoaXMuc2V0dGluZ3MuZGVmYXVsdEV4cG9ydEZvcm1hdCA9IHZhbHVlO1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXG5cdFx0bmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG5cdFx0XHQuc2V0TmFtZSgn6Ieq5Yqo5L+d5a2Y6I2J56i/Jylcblx0XHRcdC5zZXREZXNjKCflpI3liLblhoXlrrnml7boh6rliqjkv53lrZjliLDlhazkvJflj7fojYnnqL/nrrEnKVxuXHRcdFx0LmFkZFRvZ2dsZSh0b2dnbGUgPT4ge1xuXHRcdFx0XHR0b2dnbGUuc2V0VmFsdWUodGhpcy5zZXR0aW5ncy5hdXRvU2F2ZURyYWZ0KTtcblx0XHRcdFx0dG9nZ2xlLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuXHRcdFx0XHRcdHRoaXMuc2V0dGluZ3MuYXV0b1NhdmVEcmFmdCA9IHZhbHVlO1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXG5cdFx0Ly8gPT09PT09PT09PT09PT09PT09PT0g6aKE6KeI6K6+572uID09PT09PT09PT09PT09PT09PT09XG5cdFx0Y29udGFpbmVyRWwuY3JlYXRlRWwoJ2gyJywge3RleHQ6ICfpooTop4jorr7nva4nfSk7XG5cblx0XHQvLyBDbGF1ZGUgQ29kZSBBREQ6IOaWsOWinumihOiniOiuvue9rlxuXHRcdG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuXHRcdFx0LnNldE5hbWUoJ+mihOiniOeql+WPo+WuveW6picpXG5cdFx0XHQuc2V0RGVzYygn6aKE6KeI56qX5Y+j55qE6buY6K6k5a695bqm77yI5YOP57Sg77yJJylcblx0XHRcdC5hZGRUZXh0KHRleHQgPT4ge1xuXHRcdFx0XHR0ZXh0LnNldFBsYWNlaG9sZGVyKCc4MDAnKVxuXHRcdFx0XHRcdC5zZXRWYWx1ZShTdHJpbmcodGhpcy5zZXR0aW5ncy5wcmV2aWV3V2lkdGgpKVxuXHRcdFx0XHRcdC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcblx0XHRcdFx0XHRcdGNvbnN0IHdpZHRoID0gcGFyc2VJbnQodmFsdWUpO1xuXHRcdFx0XHRcdFx0aWYgKCFpc05hTih3aWR0aCkgJiYgd2lkdGggPiAwKSB7XG5cdFx0XHRcdFx0XHRcdHRoaXMuc2V0dGluZ3MucHJldmlld1dpZHRoID0gd2lkdGg7XG5cdFx0XHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0LmlucHV0RWwuc2V0QXR0cignc3R5bGUnLCAnd2lkdGg6IDEyMHB4OycpXG5cdFx0XHR9KTtcblxuXHRcdG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuXHRcdFx0LnNldE5hbWUoJ+mihOiniOabtOaWsOW7tui/nycpXG5cdFx0XHQuc2V0RGVzYygn6aKE6KeI6Ieq5Yqo5Yi35paw55qE5bu26L+f5pe26Ze077yI5q+r56eS77yJJylcblx0XHRcdC5hZGRUZXh0KHRleHQgPT4ge1xuXHRcdFx0XHR0ZXh0LnNldFBsYWNlaG9sZGVyKCc1MDAnKVxuXHRcdFx0XHRcdC5zZXRWYWx1ZShTdHJpbmcodGhpcy5zZXR0aW5ncy5wcmV2aWV3RGVsYXkpKVxuXHRcdFx0XHRcdC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcblx0XHRcdFx0XHRcdGNvbnN0IGRlbGF5ID0gcGFyc2VJbnQodmFsdWUpO1xuXHRcdFx0XHRcdFx0aWYgKCFpc05hTihkZWxheSkgJiYgZGVsYXkgPj0gMCkge1xuXHRcdFx0XHRcdFx0XHR0aGlzLnNldHRpbmdzLnByZXZpZXdEZWxheSA9IGRlbGF5O1xuXHRcdFx0XHRcdFx0XHRhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdC5pbnB1dEVsLnNldEF0dHIoJ3N0eWxlJywgJ3dpZHRoOiAxMjBweDsnKVxuXHRcdFx0fSk7XG5cblxuXHRcdC8vID09PT09PT09PT09PT09PT09PT09IOWFrOS8l+WPt+mFjee9riA9PT09PT09PT09PT09PT09PT09PVxuXHRcdGNvbnRhaW5lckVsLmNyZWF0ZUVsKCdoMicsIHt0ZXh0OiAn5YWs5LyX5Y+36YWN572uJ30pO1xuXG5cdFx0Ly8gQ2xhdWRlIENvZGUgQUREOiDmlrDlop7pu5jorqTlhazkvJflj7fpgInmi6lcblx0XHRuZXcgU2V0dGluZyhjb250YWluZXJFbClcblx0XHRcdC5zZXROYW1lKCfpu5jorqTlhazkvJflj7cnKVxuXHRcdFx0LnNldERlc2MoJ+mAieaLqem7mOiupOS9v+eUqOeahOWFrOS8l+WPt+i0puWPtycpXG5cdFx0XHQuYWRkRHJvcGRvd24oZHJvcGRvd24gPT4ge1xuXHRcdFx0XHRkcm9wZG93bi5hZGRPcHRpb24oJycsICfor7fpgInmi6knKTtcblx0XHRcdFx0aWYgKHRoaXMuc2V0dGluZ3Mud3hJbmZvICYmIHRoaXMuc2V0dGluZ3Mud3hJbmZvLmxlbmd0aCA+IDApIHtcblx0XHRcdFx0XHRmb3IgKGxldCB3eCBvZiB0aGlzLnNldHRpbmdzLnd4SW5mbykge1xuXHRcdFx0XHRcdFx0ZHJvcGRvd24uYWRkT3B0aW9uKHd4LmFwcGlkLCB3eC5uYW1lKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0ZHJvcGRvd24uc2V0VmFsdWUodGhpcy5zZXR0aW5ncy5kZWZhdWx0V3hBY2NvdW50KTtcblx0XHRcdFx0ZHJvcGRvd24ub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5zZXR0aW5ncy5kZWZhdWx0V3hBY2NvdW50ID0gdmFsdWU7XG5cdFx0XHRcdFx0YXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cblx0XHQvLyBDbGF1ZGUgQ29kZSBBREQ6IOa3u+WKoEF1dGhLZXnovpPlhaXmoYZcblx0XHRsZXQgYXV0aEtleVZhbHVlID0gJyc7XG5cdFx0bGV0IGF1dGhLZXlWZXJpZmllZCA9IGZhbHNlO1xuXHRcdG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuXHRcdFx0LnNldE5hbWUoJ+iupOivgeWvhumSpSAoQXV0aEtleSknKVxuXHRcdFx0LnNldERlc2MoJ+ivt+WFiOi+k+WFpeeUseeuoeeQhuWRmOaPkOS+m+eahEF1dGhLZXnvvIzpqozor4HpgJrov4flkI7miY3og73kv53lrZjlhazkvJflj7fkv6Hmga8nKVxuXHRcdFx0LmFkZFRleHQodGV4dCA9PiB7XG5cdFx0XHRcdHRleHQuc2V0UGxhY2Vob2xkZXIoJ+ivt+i+k+WFpUF1dGhLZXknKVxuXHRcdFx0XHRcdC5zZXRWYWx1ZSgnJylcblx0XHRcdFx0XHQub25DaGFuZ2UodmFsdWUgPT4ge1xuXHRcdFx0XHRcdFx0YXV0aEtleVZhbHVlID0gdmFsdWU7XG5cdFx0XHRcdFx0XHRhdXRoS2V5VmVyaWZpZWQgPSBmYWxzZTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0dGV4dC5pbnB1dEVsLnNldEF0dHIoJ3N0eWxlJywgJ3dpZHRoOiA0MDBweDsnKTtcblx0XHRcdH0pXG5cdFx0XHQuYWRkQnV0dG9uKGJ1dHRvbiA9PiB7XG5cdFx0XHRcdGJ1dHRvbi5zZXRCdXR0b25UZXh0KCfpqozor4FBdXRoS2V5Jyk7XG5cdFx0XHRcdGJ1dHRvbi5vbkNsaWNrKGFzeW5jICgpID0+IHtcblx0XHRcdFx0XHRpZiAoIWF1dGhLZXlWYWx1ZSB8fCBhdXRoS2V5VmFsdWUudHJpbSgpLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0XHRcdFx0bmV3IE5vdGljZSgn6K+36L6T5YWlQXV0aEtleScpO1xuXHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGJ1dHRvbi5zZXRCdXR0b25UZXh0KCfpqozor4HkuK0uLi4nKTtcblx0XHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdFx0Y29uc3QgeyBnZXRXZWNoYXRDbGllbnQgfSA9IGF3YWl0IGltcG9ydCgnLi4vc2VydmljZXMvYXBpJyk7XG5cdFx0XHRcdFx0XHRjb25zdCB3ZWNoYXRDbGllbnQgPSBnZXRXZWNoYXRDbGllbnQoKTtcblx0XHRcdFx0XHRcdGNvbnN0IHJlc3VsdCA9IGF3YWl0IHdlY2hhdENsaWVudC52ZXJpZnlBdXRoS2V5KGF1dGhLZXlWYWx1ZS50cmltKCkpO1xuXG5cdFx0XHRcdFx0XHRpZiAocmVzdWx0LmlzX3ZhbGlkKSB7XG5cdFx0XHRcdFx0XHRcdGF1dGhLZXlWZXJpZmllZCA9IHRydWU7XG5cdFx0XHRcdFx0XHRcdGNvbnN0IHZpcFRleHQgPSByZXN1bHQuaXNfdmlwID8gJyAoVklQ6LSm5oi3KScgOiAnICjmma7pgJrotKbmiLcpJztcblx0XHRcdFx0XHRcdFx0Y29uc3QgYWNjb3VudFRleHQgPSByZXN1bHQuY2FuX3JlZ2lzdGVyXG5cdFx0XHRcdFx0XHRcdFx0PyBg5Y+v5rOo5YaMICR7cmVzdWx0Lm1heF9hY2NvdW50cyAtIHJlc3VsdC5yZWdpc3RlcmVkX2FjY291bnRzfSDkuKrlhazkvJflj7dgXG5cdFx0XHRcdFx0XHRcdFx0OiAn5bey6L6+5Yiw5pyA5aSn6LSm5oi35pWw6YePJztcblx0XHRcdFx0XHRcdFx0bmV3IE5vdGljZShgQXV0aEtleemqjOivgeaIkOWKnyR7dmlwVGV4dH1cXG4ke2FjY291bnRUZXh0fWApO1xuXHRcdFx0XHRcdFx0XHRidXR0b24uc2V0QnV0dG9uVGV4dCgn4pyTIOW3sumqjOivgScpO1xuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0YXV0aEtleVZlcmlmaWVkID0gZmFsc2U7XG5cdFx0XHRcdFx0XHRcdG5ldyBOb3RpY2UoJ0F1dGhLZXnml6DmlYjmiJblt7Lov4fmnJ8nKTtcblx0XHRcdFx0XHRcdFx0YnV0dG9uLnNldEJ1dHRvblRleHQoJ+mqjOivgUF1dGhLZXknKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0XHRcdFx0YXV0aEtleVZlcmlmaWVkID0gZmFsc2U7XG5cdFx0XHRcdFx0XHRuZXcgTm90aWNlKGDpqozor4HlpLHotKXvvJoke2Vycm9yLm1lc3NhZ2UgfHwgZXJyb3J9YCk7XG5cdFx0XHRcdFx0XHRidXR0b24uc2V0QnV0dG9uVGV4dCgn6aqM6K+BQXV0aEtleScpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblxuXHRcdGxldCBpc0NsZWFyID0gdGhpcy5zZXR0aW5ncy53eEluZm8ubGVuZ3RoID4gMDtcblx0XHRsZXQgaXNSZWFsQ2xlYXIgPSBmYWxzZTtcblx0XHRjb25zdCBidXR0b25UZXh0ID0gaXNDbGVhciA/ICfmuIXnqbrlhazkvJflj7fkv6Hmga8nIDogJ+S/neWtmOWFrOS8l+WPt+S/oeaBryc7XG5cdFx0bmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG5cdFx0XHQuc2V0TmFtZSgn5YWs5LyX5Y+35L+h5oGvJylcblx0XHRcdC5hZGRUZXh0QXJlYSh0ZXh0ID0+IHtcblx0XHRcdFx0dGhpcy53eFRleHRBcmVhID0gdGV4dDtcblx0XHRcdCAgICB0ZXh0LnNldFBsYWNlaG9sZGVyKCfor7fovpPlhaXlhazkvJflj7fkv6Hmga9cXG7moLzlvI/vvJrlhazkvJflj7flkI3np7B85YWs5LyX5Y+3QXBwSUR85YWs5LyX5Y+3QXBwU2VjcmV0XFxu5aSa5Liq5YWs5LyX5Y+36K+35o2i6KGM6L6T5YWlXFxu6L6T5YWl5a6M5oiQ5ZCO54K55Ye75L+d5a2Y5oyJ6ZKuJylcblx0XHRcdFx0ICAgIC5zZXRWYWx1ZSh0aGlzLnd4SW5mbylcblx0XHRcdFx0XHQub25DaGFuZ2UodmFsdWUgPT4ge1xuXHRcdFx0XHRcdCAgICB0aGlzLnd4SW5mbyA9IHZhbHVlO1xuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdCAgLmlucHV0RWwuc2V0QXR0cignc3R5bGUnLCAnd2lkdGg6IDUyMHB4OyBoZWlnaHQ6IDEyMHB4OycpO1xuXHRcdFx0fSlcblx0XHRcblx0XHRuZXcgU2V0dGluZyhjb250YWluZXJFbCkuYWRkQnV0dG9uKGJ1dHRvbiA9PiB7XG5cdFx0XHRidXR0b24uc2V0QnV0dG9uVGV4dChidXR0b25UZXh0KTtcblx0XHRcdGJ1dHRvbi5vbkNsaWNrKGFzeW5jICgpID0+IHtcblx0XHRcdFx0aWYgKGlzQ2xlYXIpIHtcblx0XHRcdFx0XHRpc1JlYWxDbGVhciA9IHRydWU7XG5cdFx0XHRcdFx0aXNDbGVhciA9IGZhbHNlO1xuXHRcdFx0XHRcdGJ1dHRvbi5zZXRCdXR0b25UZXh0KCfnoa7orqTmuIXnqbo/Jyk7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSBpZiAoaXNSZWFsQ2xlYXIpIHtcblx0XHRcdFx0XHRpc1JlYWxDbGVhciA9IGZhbHNlO1xuXHRcdFx0XHRcdGlzQ2xlYXIgPSBmYWxzZTtcblx0XHRcdFx0XHR0aGlzLmNsZWFyKCk7XG5cdFx0XHRcdFx0YnV0dG9uLnNldEJ1dHRvblRleHQoJ+S/neWtmOWFrOS8l+WPt+S/oeaBrycpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdC8vIENsYXVkZSBDb2RlIEFERDog5qOA5p+lQXV0aEtleeaYr+WQpuW3sumqjOivgVxuXHRcdFx0XHRcdGlmICghYXV0aEtleVZlcmlmaWVkKSB7XG5cdFx0XHRcdFx0XHRuZXcgTm90aWNlKCfor7flhYjpqozor4FBdXRoS2V5Jyk7XG5cdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0YnV0dG9uLnNldEJ1dHRvblRleHQoJ+S/neWtmOS4rS4uLicpO1xuXHRcdFx0XHRcdGlmIChhd2FpdCB0aGlzLnNhdmVXWEluZm8oYXV0aEtleVZhbHVlKSkge1xuXHRcdFx0XHRcdFx0aXNDbGVhciA9IHRydWU7XG5cdFx0XHRcdFx0XHRpc1JlYWxDbGVhciA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0YnV0dG9uLnNldEJ1dHRvblRleHQoJ+a4heepuuWFrOS8l+WPt+S/oeaBrycpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdGJ1dHRvbi5zZXRCdXR0b25UZXh0KCfkv53lrZjlhazkvJflj7fkv6Hmga8nKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH0pXG5cdFx0LmFkZEJ1dHRvbihidXR0b24gPT4ge1xuXHRcdFx0YnV0dG9uLnNldEJ1dHRvblRleHQoJ+a1i+ivleWFrOS8l+WPtycpO1xuXHRcdFx0YnV0dG9uLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuXHRcdFx0XHRidXR0b24uc2V0QnV0dG9uVGV4dCgn5rWL6K+V5LitLi4uJyk7XG5cdFx0XHRcdGF3YWl0IHRoaXMudGVzdFdYSW5mbygpO1xuXHRcdFx0XHRidXR0b24uc2V0QnV0dG9uVGV4dCgn5rWL6K+V5YWs5LyX5Y+3Jyk7XG5cdFx0XHR9KVxuXHRcdH0pXG5cdH1cbn1cbiJdfQ==