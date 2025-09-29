import { App, TextAreaComponent, PluginSettingTab, Setting, Notice, sanitizeHTMLToDom } from 'obsidian';

import NoteToMpPlugin from '../core/main';

import { wxGetToken, getWechatClient } from '../services/api';
import { wxEncrypt } from '../services/wechat/weixin-api'; // 保留对加密函数的引用，因为新API中可能没有这个
import { cleanMathCache } from '../services/renderer/markdown/math';
import { NMPSettings } from '../core/settings';

// import { DocModal } from './doc-modal';

export class NoteToMpSettingTab extends PluginSettingTab {
	plugin: NoteToMpPlugin;
	wxInfo: string;
	wxTextArea: TextAreaComponent|null;
	settings: NMPSettings;

	constructor(app: App, plugin: NoteToMpPlugin) {
		super(app, plugin);
		this.plugin = plugin;
		this.settings = NMPSettings.getInstance();
		this.wxInfo = this.parseWXInfo();
	}

	displayWXInfo(txt:string) {
	    this.wxTextArea?.setValue(txt);
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

		const authKey = this.settings.authKey;
		// if (authKey.length == 0) {
		//     new Notice('请先设置authKey');
		//     return;
		// }
	    const wxInfo = this.settings.wxInfo;
		if (wxInfo.length == 0) {
		    new Notice('请先设置公众号信息');
			return;
		}
		try {

			for (let wx of wxInfo) {
				try {

					console.log(`🔍 测试公众号配置:`, {
						name: wx.name,
						appid: wx.appid,
						secret: `${wx.secret.substring(0, 8)}...${wx.secret.substring(wx.secret.length - 4)}`, // 只显示前8位和后4位
						secretLength: wx.secret.length
					});
					const tokenInfo = await wxGetToken(wx.appid, wx.secret);
					if (tokenInfo.access_token && tokenInfo.access_token.length > 0) {
						new Notice(`${wx.name} 测试通过`);
					} else {
						new Notice(`${wx.name} 测试失败：未获取到有效token`);
					}
				} catch (error) {

					let message = `${wx.name} 测试失败：${error.message || error}`;
					if (error.message && error.message.includes('40125')) {
						message = `${wx.name} 测试失败：AppSecret无效 (错误码40125)。请检查：\n1. AppSecret是否正确（长度应为32位）\n2. 是否使用了测试号的AppSecret但配置了正式号的AppID\n3. AppSecret是否已过期或被重置\n4. 公众号类型是否支持此API`;
						console.error(`AppSecret验证失败:`, {
							name: wx.name,
							appid: wx.appid,
							secretLength: wx.secret.length,
							secretPreview: `${wx.secret.substring(0, 8)}...${wx.secret.substring(wx.secret.length - 4)}`
						});
					} else if (error.message && (error.message.includes('40164') || error.message.includes('IP') || error.message.includes('whitelist'))) {

						let currentIP = '未知';

						const ipMatch = error.message.match(/(?:invalid ip|IP)[:\s]+(\d+\.\d+\.\d+\.\d+)/i);
						if (ipMatch) {
							currentIP = ipMatch[1];
						} else {

							const pureIpMatch = error.message.match(/(\d+\.\d+\.\d+\.\d+)/);
							if (pureIpMatch) {
								currentIP = pureIpMatch[1];
							}
						}
						message = `${wx.name} 测试失败：IP地址 ${currentIP} 不在白名单中，请将此IP添加到微信公众平台白名单`;
					} else if (error.message && error.message.includes('50002')) {
						message = `${wx.name} 测试失败：用户受限，可能是公众号被冻结`;
					}
					new Notice(message);
					break;
				}
			}
		} catch (error) {
			new Notice(`测试失败：${error}`);
		}
	}

	async saveWXInfo() {
	    if (this.wxInfo.length == 0) {
			new Notice('请输入内容');
			return false;
		}

		if (this.settings.wxInfo.length > 0) {
		    new Notice('已经保存过了，请先清除！');
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

			const name = items[0].trim();
			const appid = items[1].trim();
			const secret = items[2].trim();

			console.log(`📝 解析配置行:`, {
				原始行: line,
				解析后: { name, appid, secret: `${secret.substring(0, 8)}...${secret.substring(secret.length - 4)}`, secretLength: secret.length }
			});
			wechat.push({name, appid, secret});
		}

		if (wechat.length == 0) {
		    return false;
		}

		try {

			this.settings.wxInfo = wechat;
			await this.plugin.saveSettings();
			this.wxInfo = this.parseWXInfo();
			this.displayWXInfo(this.wxInfo);
			new Notice('保存成功');
			return true;

		} catch (error) {
			new Notice(`保存失败：${error}`);

		}

		return false;
	}

	async clear() {
		this.settings.wxInfo = [];
		await this.plugin.saveSettings();
		this.wxInfo = '';
		this.displayWXInfo('')
	}

	display() {
		const {containerEl} = this;

		containerEl.empty();

		this.wxInfo = this.parseWXInfo();

		const helpEl = containerEl.createEl('div');
		helpEl.style.cssText = 'display: flex;flex-direction: row;align-items: center;';
		helpEl.createEl('h2', {text: '帮助文档'}).style.cssText = 'margin-right: 10px;';
		helpEl.createEl('a', {text: 'https://github.com/IsHexx/wdwxedit-v3', attr: {href: 'https://github.com/IsHexx/wdwxedit-v3'}});

		containerEl.createEl('h2', {text: '插件设置'});

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
			.setName('在工具栏展示样式选择')
			.setDesc('建议在移动端关闭，可以增大文章预览区域')
			.addToggle(toggle => {
			    toggle.setValue(this.settings.showStyleUI);
				toggle.onChange(async (value) => {
				    this.settings.showStyleUI = value;
					await this.plugin.saveSettings();
				});
			});

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
			})

		new Setting(containerEl)
			.setName('启用空行渲染')
			.addToggle(toggle => {
			    toggle.setValue(this.settings.enableEmptyLine);
				toggle.onChange(async (value) => {
				    this.settings.enableEmptyLine = value;
					await this.plugin.saveSettings();
				});
			})
		
		new Setting(containerEl)
		.setName('渲染图片标题')
		.addToggle(toggle => {
			toggle.setValue(this.settings.useFigcaption);
			toggle.onChange(async (value) => {
				this.settings.useFigcaption = value;
				await this.plugin.saveSettings();
			});
		})

		new Setting(containerEl)
			.setName('水印图片')
			.addText(text => {
			    text.setPlaceholder('请输入图片名称')
					.setValue(this.settings.watermark)
					.onChange(async (value) => {
					  this.settings.watermark = value.trim();
						await this.plugin.saveSettings();
					})
					.inputEl.setAttr('style', 'width: 320px;')
			})

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
			})
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
		})
		const customCSSDoc = '使用指南：<a href="https://github.com/IsHexx/wdwxedit-v3">https://github.com/IsHexx/wdwxedit-v3</a>';
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
				.inputEl.setAttr('style', 'width: 320px;')
		});

		let descHtml = '详情说明：<a href="https://github.com/IsHexx/wdwxedit-v3">https://github.com/IsHexx/wdwxedit-v3</a>';
		if (this.settings.isVip) {
			descHtml = '<span style="color:rgb(245, 70, 85);font-weight: bold;">👑永久会员</span><br/>' + descHtml;
		}
		else if (this.settings.expireat) {
			const timestr = this.settings.expireat.toLocaleString();
			descHtml = `有效期至：${timestr} <br/>${descHtml}`
		}
		new Setting(containerEl)
			.setName('注册码（AuthKey）')
			.setDesc(sanitizeHTMLToDom(descHtml))
			.addText(text => {
				text.setPlaceholder('请输入注册码')
				.setValue(this.settings.authKey)
				.onChange(async (value) => {
						this.settings.authKey = value.trim();
					this.settings.getExpiredDate();
					await this.plugin.saveSettings();
				})
				.inputEl.setAttr('style', 'width: 320px;')
			}).descEl.setAttr('style', '-webkit-user-select: text; user-select: text;')

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
			})
		
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
					button.setButtonText('保存中...');
					if (await this.saveWXInfo()) {
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
			})
		})
	}
}
