import { App, TextAreaComponent, PluginSettingTab, Setting, Notice, sanitizeHTMLToDom } from 'obsidian';

import WxEditPlugin from '../core/main';

import { wxGetToken, getWechatClient } from '../services/api';
import { wxEncrypt } from '../services/wechat/weixin-api'; // 保留对加密函数的引用，因为新API中可能没有这个
import { cleanMathCache } from '../services/renderer/markdown/math';
import { WxSettings } from '../core/settings';

// import { DocModal } from './doc-modal';

export class WxSettingTab extends PluginSettingTab {
	plugin: WxEditPlugin;
	wxInfo: string;
	wxTextArea: TextAreaComponent|null;
	settings: WxSettings;

	constructor(app: App, plugin: WxEditPlugin) {
		super(app, plugin);
		this.plugin = plugin;
		this.settings = WxSettings.getInstance();
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

	async saveWXInfo(authKey?: string) {
	    if (this.wxInfo.length == 0) {
			new Notice('请输入内容');
			return false;
		}

		if (this.settings.wxInfo.length > 0) {
		    new Notice('已经保存过了，请先清除！');
		    return false;
		}

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

				} catch (error) {

					new Notice(`同步公众号 ${wx.name} 到后端失败: ${error.message || error}`);
					return false;
				}
			}

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
		helpEl.createEl('a', {text: 'https://github.com/IsHexx/WDWXEdit', attr: {href: 'https://github.com/IsHexx/WDWXEdit'}});

		// ==================== 主题与样式设置 ====================
		containerEl.createEl('h2', {text: '主题与样式'});

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
					.inputEl.setAttr('style', 'width: 120px;')
			});

		// ==================== 内容渲染设置 ====================
		containerEl.createEl('h2', {text: '内容渲染'});

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
		containerEl.createEl('h2', {text: '排版设置'});

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
		containerEl.createEl('h2', {text: '图片处理'});

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
					.inputEl.setAttr('style', 'width: 320px;')
			});

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
					.inputEl.setAttr('style', 'width: 120px;')
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
					.inputEl.setAttr('style', 'width: 120px;')
			});

		// ==================== 自定义样式 ====================
		containerEl.createEl('h2', {text: '自定义样式'});

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
				.inputEl.setAttr('style', 'width: 320px;')
		});

		// ==================== 导出设置 ====================
		containerEl.createEl('h2', {text: '导出设置'});

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
		containerEl.createEl('h2', {text: '预览设置'});

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
					.inputEl.setAttr('style', 'width: 120px;')
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
					.inputEl.setAttr('style', 'width: 120px;')
			});

		// ==================== 公众号配置 ====================
		containerEl.createEl('h2', {text: '公众号配置'});

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
						} else {
							authKeyVerified = false;
							new Notice('AuthKey无效或已过期');
							button.setButtonText('验证AuthKey');
						}
					} catch (error) {
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
			})
		})
	}
}
