# WDWXEdit

[![Version](https://img.shields.io/github/v/release/IsHexx/WDWXEdit)](https://github.com/IsHexx/WDWXEdit/releases)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Obsidian Plugin](https://img.shields.io/badge/Obsidian-Plugin-7C3AED)](https://obsidian.md/)

一款强大的 Obsidian 插件，能够将笔记无缝发布到微信公众号，完美保持格式。

> 🎉 **v1.0.0 已发布！** [查看 Release](https://github.com/IsHexx/WDWXEdit/releases/tag/v1.0.0)

## 📦 下载安装

- **GitHub Release**: https://github.com/IsHexx/WDWXEdit/releases/latest
- **开发仓库**（私有）: https://github.com/IsHexx/WeWxEdit
- **公开仓库**: https://github.com/IsHexx/WDWXEdit

## 🌟 功能特性

- **完美格式保持**: 发布到微信公众号时保持笔记原始样式
- **代码高亮**: 支持完整语法高亮，可自定义主题
- **数学公式支持**: 完美渲染 LaTeX 和 AsciiMath 公式
- **本地图片上传**: 自动上传本地图片到微信媒体库
- **多主题支持**: 30+ 内置主题，打造精美文章展示
- **自定义 CSS**: 支持添加自定义样式
- **标注块支持**: 完整支持 Obsidian 标注块，美观样式
- **草稿管理**: 直接在微信公众号后台创建草稿

## 🚀 快速开始

### 安装

1. 打开 Obsidian 设置
2. 进入社区插件并关闭安全模式
3. 点击浏览，搜索 "WDWXEdit"
4. 安装并启用插件

### 配置

1. **获取微信公众号凭证**:
   - 登录微信公众号后台
   - 进入设置 → 基本设置
   - 获取 AppID 和 AppSecret

2. **配置插件**:
   - 打开插件设置
   - 输入 AppID 和 AppSecret
   - 保存设置

3. **开始发布**:
   - 打开任意笔记
   - 点击左侧边栏的"微信"图标
   - 选择复制内容或创建草稿
   - 笔记将被格式化并准备就绪

## 📖 使用方法

### 发布选项

- **复制到剪贴板**: 复制格式化 HTML 到微信编辑器
- **创建草稿**: 直接在微信公众号创建草稿

### 支持的内容

- **标题**: 所有标题级别，可自定义样式
- **代码块**: 语法高亮，带行号
- **数学公式**: LaTeX 和 AsciiMath 支持
- **图片**: 本地图片自动上传
- **链接**: 转换为微信兼容格式
- **标注块**: Obsidian 标注块，美观样式
- **表格**: 完整表格支持，带样式
- **列表**: 有序和无序列表
- **引用**: 样式化引用块

### 主题

从 30+ 专业设计主题中选择：
- 默认主题：干净现代的外观
- 代码高亮主题：技术内容专用
- 自定义主题：个性化样式

## ⚙️ 配置选项

### 基础设置

- **AppID/AppSecret**: 微信公众号凭证
- **主题选择**: 选择偏好主题
- **图片质量**: 设置图片压缩质量
- **自定义 CSS**: 添加自定义样式

### 高级功能

- **自定义 Frontmatter**: 控制单笔记设置
- **样式覆盖**: 按笔记覆盖主题样式
- **图片水印**: 为上传图片添加水印

## 📝 Frontmatter 支持

在笔记的 frontmatter 中添加这些选项：

```yaml
---
theme: github-light
customCSS: |
  .content { font-size: 16px; }
watermark: true
---
```

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

## 📞 支持

- **问题反馈**: [GitHub Issues](https://github.com/IsHexx/WDWXEdit/issues)
- **功能讨论**: [GitHub Discussions](https://github.com/IsHexx/WDWXEdit/discussions)
- **更新日志**: [CHANGELOG.md](https://github.com/IsHexx/WDWXEdit/blob/main/CHANGELOG.md)
- **联系作者**: [IsHexx](https://github.com/IsHexx)

## 🔗 相关链接

- **公开仓库**: https://github.com/IsHexx/WDWXEdit
- **最新版本**: https://github.com/IsHexx/WDWXEdit/releases/latest
- **文档**: https://github.com/IsHexx/WDWXEdit/blob/main/README.md

## 🏗️ 开发

本项目使用私有仓库进行开发，通过 GitHub Actions 自动同步到公开仓库。

- **私有开发仓库**: https://github.com/IsHexx/WeWxEdit
- **公开发布仓库**: https://github.com/IsHexx/WDWXEdit

---

用 ❤️ 为 Obsidian 社区打造 | Made by [IsHexx](https://github.com/IsHexx)