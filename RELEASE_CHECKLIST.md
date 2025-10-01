# 📋 WDWXEdit 发布检查清单

## ✅ 已完成项

### 1. 核心文件检查
- [x] `manifest.json` - 版本1.3.1，配置完整
- [x] `main.js` - 已构建 (2.49 MB)
- [x] `styles.css` - 样式文件存在 (11.4 KB)
- [x] `LICENSE` - MIT许可证
- [x] `versions.json` - 版本映射记录
- [x] `icon.svg` - 插件图标已创建

### 2. 文档准备
- [x] README.md - 基础文档完整
- [x] README_UPDATED.md - 包含截图的增强版文档（待替换）

### 3. 代码质量
- [x] TypeScript编译无错误
- [x] 所有功能测试通过
- [x] .gitignore 配置正确（排除server/等）

## 🔲 待完成项

### 1. 视觉资源 ⚠️ 重要

#### 必需资源
- [ ] **插件图标优化**
  - 当前：已有基础SVG图标
  - 建议：可以找设计师优化，或使用AI工具生成更精美的图标
  - 尺寸：建议至少 256x256px
  - 工具推荐：Figma、Canva、Midjourney

#### 推荐资源（大幅提升下载率）
- [ ] **功能截图** (建议准备3-5张)

  **截图1: 主界面预览**
  - 文件名：`images/screenshot-main.png`
  - 内容：展示预览视图，包含样式编辑器
  - 尺寸：1920x1080 或 1280x720
  - 当前状态：已有 `images/screenshot.png` 可用

  **截图2: 样式编辑器详情**
  - 文件名：`images/screenshot-editor.png`
  - 内容：展示新增的自定义主题色功能、字号选择等
  - 突出点：自定义颜色选择器、新字号选项

  **截图3: 发布效果对比**
  - 文件名：`images/screenshot-comparison.png`
  - 内容：左边Obsidian，右边微信公众号效果
  - 展示：代码高亮、公式、图片等效果

  **截图4: 设置界面**
  - 文件名：`images/screenshot-settings.png`
  - 内容：公众号配置界面

  **截图5: 功能特性**
  - 文件名：`images/screenshot-features.png`
  - 内容：代码块、数学公式、标注块等

#### 截图工具推荐
- Windows: Snipaste、ShareX
- macOS: CleanShot X、Shottr
- 在线工具: Figma (添加标注)

#### 截图最佳实践
```
✅ 推荐：
- 使用高分辨率（至少1280px宽）
- 使用真实内容示例
- 界面整洁，关闭无关窗口
- 使用浅色主题（更清晰）
- 可添加箭头或文字标注重点功能

❌ 避免：
- 模糊或低分辨率
- 包含个人敏感信息
- 过于复杂的界面
```

### 2. 文档更新
- [ ] 用 `README_UPDATED.md` 替换 `README.md`
- [ ] 确保所有截图链接正确
- [ ] 检查英文描述是否准确（manifest.json中的description）

### 3. 发布流程

#### 步骤1: 最终构建
```bash
cd /d/code/wechatEdit/wdwxedit-v3
npm run build
```
- 确保没有TypeScript错误
- 检查main.js文件大小正常

#### 步骤2: 同步到发布仓库
```bash
# 在开发仓库
git add .
git commit -m "release: v1.3.1 准备发布

✨ 新功能
- 增加自定义主题色选择器
- 新增字号选项20px、22px、24px
- 优化样式编辑器UI

🐛 修复
- 修复重置样式功能不完整
- 修复22px和24px字号不生效

📝 文档
- 更新README添加功能截图
- 优化使用说明
"

# 推送到开发仓库
git push origin wdwxedit-v3

# 推送到发布仓库（确保已配置remote）
git push release wdwxedit-v3:main
```

#### 步骤3: 创建GitHub Release

**在发布仓库创建Release:**
- 访问：`https://github.com/IsHexx/WDWXEdit/releases/new`

**Release配置:**
- Tag version: `1.3.1`
- Release title: `v1.3.1 - 样式编辑器增强`
- Description: (参考下方Release Notes模板)

**上传文件:**
- `main.js`
- `manifest.json`
- `styles.css`

**Release Notes 模板:**
```markdown
## ✨ 新功能

### 🎨 自定义主题色
- 新增自定义颜色选择器，支持选择任意颜色
- 保留6种预设主题色快速选择
- 实时预览颜色效果

### 🔤 字号选项优化
- 新增大字号：20px、22px、24px
- 移除使用较少的15px和17px
- 优化字号选择体验

### 🎯 样式编辑器增强
- 优化布局和交互体验
- 改进控件排列
- 提升响应速度

## 🐛 Bug修复
- 修复重置样式功能不完整，现在会正确重置所有样式选项
- 修复22px和24px字号选择后不生效的问题
- 修复颜色选择器状态同步问题

## 🔧 改进
- 更新默认样式：非衬线字体、16px字号、石墨黑主题色
- 优化字号映射逻辑，支持更多像素值
- 改进样式编辑器UI更新机制

## 📦 安装说明

### 从社区插件安装
1. 打开 Obsidian 设置
2. 进入社区插件，搜索 "WDWXEdit"
3. 点击安装并启用

### 手动安装
1. 下载附件中的文件
2. 解压到 `.obsidian/plugins/wdwx-edit/`
3. 重启 Obsidian 并启用插件

## 📝 更新说明
如果从旧版本更新，建议：
1. 在插件设置中点击"重置样式"查看新的默认样式
2. 尝试新增的自定义主题色功能
3. 测试新增的大字号选项

## 🙏 感谢
感谢所有用户的反馈和建议！
```

#### 步骤4: 提交到Obsidian社区插件

**首次提交（如果还没有）:**

1. Fork官方插件仓库
   - `https://github.com/obsidianmd/obsidian-releases`

2. 编辑 `community-plugins.json`
   - 在文件末尾添加你的插件信息：
   ```json
   {
     "id": "wdwx-edit",
     "name": "WDWXEdit",
     "author": "IsHexx",
     "description": "Publish Obsidian notes to WeChat Official Account with perfect formatting, code highlighting, math formulas, and local image upload support.",
     "repo": "IsHexx/WDWXEdit"
   }
   ```

3. 创建Pull Request
   - 标题：`Add plugin: WDWXEdit`
   - 说明插件功能、用途、特色

4. 等待官方审核
   - 通常需要1-2周
   - 可能需要根据反馈修改

**后续版本更新:**
- 只需在发布仓库创建新的Release
- Obsidian会自动检测更新

## 📊 发布后跟踪

### 监控指标
- [ ] GitHub Star 数量
- [ ] Issues 和 Discussions 反馈
- [ ] 下载量（通过Obsidian社区统计）

### 社区推广
- [ ] 发布到Obsidian Discord频道
- [ ] 发布到相关Reddit社区
- [ ] 撰写使用教程博客文章

## 🔍 质量检查

### 发布前最后确认
- [ ] 在全新的Obsidian vault中测试安装
- [ ] 测试所有核心功能正常
- [ ] 确认没有控制台错误
- [ ] 检查所有链接有效
- [ ] README中的截图显示正常
- [ ] manifest.json中的所有URL正确

### 常见问题预防
- [ ] 确保main.js不超过10MB（当前2.49MB ✓）
- [ ] 确保没有包含node_modules
- [ ] 确保没有包含server/目录
- [ ] 确保版本号一致（manifest.json, versions.json, package.json）

## 📞 联系方式

如有疑问：
- GitHub Issues: https://github.com/IsHexx/WDWXEdit/issues
- GitHub Discussions: https://github.com/IsHexx/WDWXEdit/discussions

---

**准备就绪后，开始发布！🚀**
