# 📦 WDWXEdit v1.0.0 发布文件清单

## 🎯 发布概述

- **版本号**: 1.0.0
- **发布日期**: 2025-10-01
- **私有仓库**: https://github.com/IsHexx/WeWxEdit.git
- **公开仓库**: https://github.com/IsHexx/WDWXEdit/
- **发布分支**: wdwxedit-v3

## 📋 必需发布文件

### 1. 核心插件文件（Obsidian 必需）

| 文件 | 大小 | 说明 | 状态 |
|------|------|------|------|
| `main.js` | 2.5MB | 插件核心代码（已构建） | ✅ |
| `manifest.json` | 405B | 插件清单文件 | ✅ |
| `styles.css` | 12KB | 插件样式文件 | ✅ |

### 2. 文档文件

| 文件 | 大小 | 说明 | 状态 |
|------|------|------|------|
| `README.md` | - | 项目说明文档（来自 public-assets） | ✅ |
| `LICENSE` | 1.1KB | Apache 2.0 开源协议（来自 public-assets） | ✅ |
| `CHANGELOG.md` | - | 版本更新日志 | ⏳ 待创建 |

### 3. 资源文件

| 文件 | 说明 | 状态 |
|------|------|------|
| `assets.zip` | 主题资源包（由 build-assets.mjs 生成） | ✅ |

### 4. 配置文件

| 文件 | 说明 | 状态 |
|------|------|------|
| `versions.json` | 版本兼容性配置 | ✅ |

## 🚫 排除文件/目录

以下文件/目录不会同步到公开仓库（由 sync-public.yml 配置）：

- `.git/` - Git 版本控制
- `.github/workflows/sync-public.yml` - 同步工作流配置
- `tools/clean-for-public.js` - 清理脚本
- `public-assets/` - 公开资源源文件
- `server/` - 后端 API 服务
- `CLAUDE.md` - Claude Code 指导文件
- `.claude/` - Claude Code 配置
- `node_modules/` - 依赖包
- `*.log` - 日志文件
- `.DS_Store` / `Thumbs.db` - 系统文件

## 🔄 发布流程

### 自动发布（推荐）

1. **触发条件**：
   - 推送到 `wdwxedit-v3` 分支
   - 创建 GitHub Release
   - 手动触发 workflow

2. **自动化步骤**：
   ```
   安装依赖 → 清理代码 → 构建生产版本 → 构建资源包 →
   准备公开文档 → 同步到公开仓库 → 创建 Release（如适用）
   ```

### 手动发布（备用）

```bash
# 1. 构建生产版本
npm run build

# 2. 构建资源包
npm run build:assets

# 3. 检查版本号
cat manifest.json | grep version
cat package.json | grep version
cat versions.json

# 4. 创建 Git 标签
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# 5. 在 GitHub 上创建 Release，上传以下文件：
# - main.js
# - manifest.json
# - styles.css
# - assets.zip
```

## 📝 Release 发布说明模板

```markdown
## 🎉 WDWXEdit v1.0.0 - 首次公开发布

### ✨ 主要特性

- 🎨 **30+ 精美主题**: 支持多种主题风格，满足不同场景需求
- 📝 **完美格式转换**: 保持 Markdown 原有格式，无缝转换微信公众号样式
- 🖼️ **智能图片处理**: 自动处理本地图片，支持压缩和优化
- 💻 **代码语法高亮**: 支持多种编程语言的精美高亮
- 📐 **数学公式支持**: 完整支持 LaTeX 和 AsciiMath
- 🎯 **Obsidian Callouts**: 完美支持标注块转换
- 🔗 **智能链接处理**: 自动处理内部和外部链接
- 📚 **脚注自动转换**: 智能处理脚注格式

### 📦 安装方式

**方法 1：通过 Obsidian 社区插件**
1. 打开 Obsidian
2. 前往 设置 → 社区插件
3. 搜索 "WDWXEdit"
4. 点击安装并启用

**方法 2：手动安装**
1. 下载下方的 Release 文件
2. 解压到 Obsidian 插件目录
3. 在设置中启用插件

### 🚀 快速开始

1. 打开任意 Markdown 笔记
2. 使用命令面板（Ctrl+P）搜索 "WDWXEdit"
3. 选择主题并预览
4. 点击复制，粘贴到微信公众号编辑器

### 📋 下载文件

- `main.js` - 插件核心代码
- `manifest.json` - 插件清单
- `styles.css` - 插件样式
- `assets.zip` - 主题资源包（自动下载）

### 🔗 相关链接

- 📖 [完整文档](https://github.com/IsHexx/WDWXEdit/blob/main/README.md)
- 🐛 [问题反馈](https://github.com/IsHexx/WDWXEdit/issues)
- 💬 [讨论区](https://github.com/IsHexx/WDWXEdit/discussions)

---

🤖 *This release was automatically generated from the private repository.*
```

## ✅ 发布前检查清单

- [x] 版本号已更新到 1.0.0
- [x] GitHub Actions workflow 配置完成
- [x] 清理脚本 (clean-for-public.js) 已配置
- [x] 公开 README.md 已准备
- [x] LICENSE 文件已准备（Apache 2.0）
- [ ] CHANGELOG.md 需要创建
- [ ] 运行构建测试 `npm run build`
- [ ] 验证 assets.zip 生成正常
- [ ] 配置 GitHub Secrets（如未配置）：
  - `PUBLIC_REPO_TOKEN` - 公开仓库访问令牌
  - `PUBLIC_REPO_URL` - 公开仓库 URL (IsHexx/WDWXEdit)

## 🔐 GitHub Secrets 配置

需要在私有仓库配置以下 Secrets：

| Secret 名称 | 值 | 说明 |
|------------|-----|------|
| `PUBLIC_REPO_TOKEN` | ghp_xxxx... | GitHub Personal Access Token |
| `PUBLIC_REPO_URL` | IsHexx/WDWXEdit | 公开仓库路径 |

**创建 Token 步骤：**
1. GitHub Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. 权限选择：`repo`（完整仓库访问权限）
4. 复制 token 并添加到私有仓库 Secrets

## 📊 发布后验证

- [ ] 检查公开仓库是否成功同步
- [ ] 验证 Release 是否正确创建
- [ ] 确认 assets.zip 是否成功上传
- [ ] 测试插件安装和基本功能
- [ ] 检查文档链接是否正常

## 🎯 下一步计划

- [ ] 提交到 Obsidian 官方社区插件市场
- [ ] 创建使用教程和视频
- [ ] 收集用户反馈
- [ ] 规划 v1.1.0 版本功能
