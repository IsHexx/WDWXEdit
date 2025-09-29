# WDWXEdit

<div align="center">

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Obsidian Plugin](https://img.shields.io/badge/Obsidian-Plugin-7C3AED)](https://obsidian.md/)
[![Version](https://img.shields.io/github/v/release/IsHexx/WDWXEdit)](https://github.com/IsHexx/WDWXEdit/releases)

**一个强大的 Obsidian 插件，支持将 Markdown 笔记一键发布到微信公众号**

完美保持格式 • 代码高亮 • 数学公式 • 图片上传 • 多主题支持

</div>

## ✨ 特性

- **🎨 丰富主题**: 30+ 款精美主题，支持代码高亮样式
- **📝 完美格式**: 保持 Markdown 原有格式，无缝转换微信公众号样式
- **🖼️ 图片处理**: 自动处理本地图片，支持图片压缩和优化
- **💻 代码高亮**: 支持多种编程语言的语法高亮
- **📐 数学公式**: 支持 LaTeX 和 AsciiMath 数学公式渲染
- **📋 一键复制**: 格式化后可直接粘贴到微信公众号编辑器
- **🎯 标注支持**: 完美支持 Obsidian 的 Callouts 标注块
- **🔗 链接处理**: 智能处理内部链接和外部链接
- **📚 脚注支持**: 自动处理脚注并转换为微信适配格式

## 📦 安装

### 方法 1：通过 Obsidian 社区插件

1. 打开 Obsidian
2. 前往 `设置` → `社区插件`
3. 搜索 "WDWXEdit"
4. 点击安装并启用

### 方法 2：手动安装

1. 从 [Releases](https://github.com/IsHexx/WDWXEdit/releases) 下载最新版本
2. 解压文件到你的 Obsidian 插件目录：
   ```
   {Obsidian Vault}/.obsidian/plugins/wdwxedit/
   ```
3. 在 Obsidian 设置中启用插件

## 🚀 使用方法

### 基本使用

1. **打开笔记预览**：在任意 Markdown 笔记中，使用命令面板 (`Ctrl+P`) 搜索 "WDWXEdit"
2. **选择主题**：在预览窗口中选择你喜欢的主题样式
3. **预览效果**：实时预览转换后的效果
4. **复制内容**：点击复制按钮，内容自动复制到剪贴板
5. **发布到微信**：在微信公众号后台编辑器中粘贴即可

### 高级功能

#### 🎨 自定义主题

支持通过 CSS 自定义主题样式：

```css
/* 在笔记中添加自定义样式 */
<style>
.custom-theme {
  --primary-color: #your-color;
  --font-family: "Your Font";
}
</style>
```

#### 💻 代码块样式

支持多种代码高亮主题：

````markdown
```javascript
// 支持语法高亮
function hello() {
  console.log('Hello WDWXEdit!');
}
```
````

#### 📐 数学公式

支持 LaTeX 和 AsciiMath 语法：

```markdown
行内公式：$E = mc^2$

块级公式：
$$
\sum_{i=1}^{n} x_i = x_1 + x_2 + \cdots + x_n
$$
```

#### 🎯 标注块

完美支持 Obsidian Callouts：

```markdown
> [!NOTE] 提示
> 这是一个提示标注块

> [!WARNING] 警告
> 这是一个警告标注块
```

## 🎨 主题预览

插件内置了多种精美主题：

- **默认主题**: 简洁清爽的默认样式
- **Github**: Github 风格的技术文档样式  
- **Vue**: Vue.js 官方文档风格
- **科技蓝**: 现代科技感的蓝色主题
- **商务灰**: 商务风格的灰色主题
- **更多主题**: 持续更新中...

## ⚙️ 配置选项

在插件设置中可以配置：

- **默认主题**: 选择默认使用的主题
- **代码高亮**: 选择代码高亮样式
- **图片处理**: 配置图片压缩和优化选项
- **格式设置**: 自定义各种格式转换选项

## 🤝 贡献

欢迎贡献代码、报告问题或提出建议！

1. Fork 这个仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

## 📋 待办事项

- [ ] 支持更多微信公众号平台
- [ ] 添加更多主题样式
- [ ] 优化图片处理性能
- [ ] 支持批量文章处理
- [ ] 添加快捷键支持

## 🐛 问题反馈

如果你遇到任何问题或有功能建议，请：

1. 查看 [FAQ](https://github.com/IsHexx/WDWXEdit/wiki/FAQ)
2. 搜索 [已有的 Issues](https://github.com/IsHexx/WDWXEdit/issues)
3. 创建 [新的 Issue](https://github.com/IsHexx/WDWXEdit/issues/new)

## 📜 开源协议

本项目基于 [Apache License 2.0](LICENSE) 开源协议。

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者和用户！

特别感谢：
- [Obsidian](https://obsidian.md/) 提供强大的笔记平台
- [Marked.js](https://marked.js.org/) 提供 Markdown 解析支持
- [Highlight.js](https://highlightjs.org/) 提供代码高亮功能

---

<div align="center">

**如果这个插件对你有帮助，请给个 ⭐️ Star 支持一下！**

Made with ❤️ by [YiNian](https://github.com/IsHexx)

</div>