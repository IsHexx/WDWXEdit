# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-01

### 🎉 首次公开发布

这是 WDWXEdit 的首次公开版本，完整实现了将 Obsidian 笔记发布到微信公众号的所有核心功能。

### ✨ Added - 新增功能

#### 核心功能
- **主题系统**: 内置 30+ 款精美主题，支持实时切换预览
- **Markdown 解析**: 基于 marked.js 的完整 Markdown 解析引擎
- **预览视图**: 实时预览转换后的微信公众号效果
- **一键复制**: 格式化内容可直接粘贴到微信公众号编辑器
- **图标系统**: 统一使用 fish-symbol (🐟) 作为插件图标

#### Markdown 扩展支持
- **代码高亮**: 支持多种编程语言的语法高亮，集成 highlight.js
- **数学公式**: 完整支持 LaTeX 和 AsciiMath 数学公式渲染
- **Callouts 标注块**: 完美支持 Obsidian 的标注块（NOTE, WARNING, TIP 等）
- **脚注处理**: 自动转换 Markdown 脚注为微信适配格式
- **链接处理**: 智能处理内部链接和外部链接
- **本地文件**: 支持嵌入本地图片和文件

#### 图片处理
- **本地图片上传**: 自动处理本地图片到微信媒体库
- **图片压缩**: 支持图片压缩和优化
- **Base64 支持**: 小图片可转换为 Base64 嵌入

#### 样式定制
- **自定义样式**: 支持通过笔记添加自定义 CSS 样式
- **主题编辑器**: 内置样式编辑器，可实时预览效果
- **代码主题**: 多种代码高亮主题可选
- **颜色定制**: 支持自定义主题颜色

#### 微信公众号集成
- **草稿管理**: 支持直接创建微信公众号草稿
- **多账号支持**: 可配置多个微信公众号账号
- **图片上传**: 自动上传图片到微信媒体库
- **Token 管理**: 智能 Access Token 缓存和刷新

#### 用户界面
- **Ribbon 图标**: 左侧边栏快速访问入口
- **右键菜单**: 文件右键菜单快速发布
- **命令面板**: 通过命令面板快速调用
- **设置面板**: 完整的配置选项界面

#### 资源管理
- **主题下载**: 自动下载和管理主题资源包
- **资源缓存**: 本地缓存机制减少重复下载
- **Assets 打包**: 支持打包主题资源为 zip 文件

### 🔧 Technical - 技术特性

#### 架构设计
- **模块化架构**: 清晰的模块划分和职责分离
- **扩展系统**: 可扩展的 Markdown 处理器架构
- **单例模式**: 资源管理和配置管理使用单例模式
- **回调接口**: MDRendererCallback 提供灵活的扩展接口

#### 构建系统
- **esbuild**: 高性能构建工具
- **TypeScript**: 完整的类型定义
- **资源打包**: 自动化资源打包脚本
- **代码清理**: 自动清理私有代码用于公开发布

#### GitHub Actions
- **自动发布**: 推送代码自动同步到公开仓库
- **Release 自动化**: 创建 Release 自动打标签和上传资源
- **代码清理**: 自动移除私有注释和敏感信息
- **构建验证**: 自动运行构建和类型检查

### 📝 Documentation - 文档

- **README.md**: 完整的项目说明和使用指南
- **CHANGELOG.md**: 版本更新日志
- **RELEASE_FILES.md**: 详细的发布文件清单
- **CLAUDE.md**: 项目开发指导文档
- **LICENSE**: Apache 2.0 开源协议

### 🎨 Themes - 主题

内置主题列表：
- 默认主题
- Github 风格
- Vue.js 官方风格
- 科技蓝
- 商务灰
- 橙心主题
- 绿意主题
- 红绒主题
- 山吹主题
- 紫薇主题
- 姹紫主题
- 丹青主题
- 兰青主题
- 雅黑主题
- _(更多主题持续更新中...)_

### 🔒 Security - 安全

- **代码清理**: 发布前自动清理敏感信息
- **Token 安全**: 微信 Access Token 加密存储
- **私有仓库**: 敏感代码保存在私有仓库
- **权限控制**: GitHub Actions 使用 Token 权限控制

### 🛠️ Development - 开发工具

- **开发模式**: `npm run dev` 支持文件监听和热重载
- **构建脚本**: `npm run build` 完整构建和类型检查
- **资源下载**: `npm run download` 下载主题资源
- **版本管理**: `npm run version` 自动化版本管理

### 📦 Dependencies - 主要依赖

- **Obsidian API**: latest
- **marked.js**: ^12.0.1
- **marked-highlight**: ^2.1.3
- **highlight.js**: ^11.9.0
- **html-to-image**: ^1.11.11
- **@zip.js/zip.js**: ^2.7.43
- **TypeScript**: 4.7.4
- **esbuild**: 0.17.3

### 🌐 Platform Support - 平台支持

- **Obsidian**: >= 1.4.5
- **Desktop**: Windows, macOS, Linux
- **Mobile**: iOS, Android

### 📊 Statistics - 统计

- **代码行数**: ~15,000+ 行
- **主题数量**: 30+ 款
- **支持语言**: JavaScript, TypeScript, Python, Java, C++, Go, Rust 等 100+ 种
- **文件大小**: main.js ~2.5MB

### 🙏 Credits - 致谢

特别感谢以下开源项目和工具：
- [Obsidian](https://obsidian.md/) - 强大的笔记平台
- [Marked.js](https://marked.js.org/) - Markdown 解析器
- [Highlight.js](https://highlightjs.org/) - 代码语法高亮
- [html-to-image](https://github.com/bubkoo/html-to-image) - HTML 转图片
- [zip.js](https://gildas-lormeau.github.io/zip.js/) - ZIP 文件处理

### 📝 Notes - 说明

- 这是首次公开发布版本，已经过充分测试
- 支持 Obsidian 1.4.5 及以上版本
- 建议定期更新以获得最新功能和修复
- 如遇问题请访问 [GitHub Issues](https://github.com/IsHexx/WDWXEdit/issues)

### 🔗 Links - 相关链接

- **GitHub**: https://github.com/IsHexx/WDWXEdit
- **Issues**: https://github.com/IsHexx/WDWXEdit/issues
- **Discussions**: https://github.com/IsHexx/WDWXEdit/discussions

---

## [Unreleased] - 未发布

### 🔮 Planned - 计划中

- [ ] 支持更多微信公众号平台功能
- [ ] 添加更多主题样式
- [ ] 优化图片处理性能
- [ ] 支持批量文章处理
- [ ] 添加快捷键支持
- [ ] 国际化（i18n）支持
- [ ] 导出为 PDF 功能
- [ ] 模板系统
- [ ] 插件市场集成

---

**版本说明**:
- 遵循 [语义化版本 2.0.0](https://semver.org/spec/v2.0.0.html)
- 版本格式: 主版本号.次版本号.修订号
- 主版本号: 不兼容的 API 修改
- 次版本号: 向下兼容的功能性新增
- 修订号: 向下兼容的问题修正
