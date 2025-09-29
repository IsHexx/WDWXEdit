# Claude Code ADD
# GitHub Actions 自动同步配置指南

本文档指导你如何配置 GitHub Actions 自动同步到公开仓库。

## 🔧 配置步骤

### 1. 创建 Personal Access Token

1. 访问 GitHub Settings → Developer settings → Personal access tokens
2. 点击 "Generate new token (classic)"
3. 设置 Token 名称，例如：`WDWXEdit-Public-Sync`
4. 选择权限范围：
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
5. 点击 "Generate token"
6. **重要**：立即复制 token，它只会显示一次

### 2. 在私有仓库配置 Secrets

在当前私有仓库中配置以下 Secrets：

1. 访问仓库 Settings → Secrets and variables → Actions
2. 添加以下两个 Repository secrets：

#### SECRET 1: PUBLIC_REPO_TOKEN
```
Name: PUBLIC_REPO_TOKEN
Value: ghp_YOUR_PUBLIC_REPO_TOKEN_HERE
```

#### SECRET 2: PUBLIC_REPO_URL
```
Name: PUBLIC_REPO_URL
Value: IsHexx/WDWXEdit
```

### 3. 验证配置

配置完成后，你可以：

1. **手动测试**：在 Actions 页面找到 "Sync to Public Repository" workflow，点击 "Run workflow"
2. **创建 Release 测试**：在仓库中创建一个新的 Release，观察是否自动触发同步

## 🚀 使用流程

### 日常开发
1. 在私有仓库的 `wdwxedit-v3` 分支正常开发
2. 提交代码到私有仓库
3. **私有仓库代码保持不变**

### 发布开源版本
1. 在私有仓库创建 Release：
   - 前往 Releases 页面
   - 点击 "Create a new release"
   - 设置 Tag 和 Release 名称
   - 发布 Release
2. GitHub Actions 自动触发：
   - 拉取 `wdwxedit-v3` 分支代码
   - 清理 console 日志和敏感信息
   - 删除后端 API 相关代码
   - 同步到公开仓库
   - 在公开仓库创建对应的 Release

## 📋 清理规则

自动同步时会进行以下清理：

### 代码清理
- ✅ 移除所有 `console.log/warn/error/debug/info` 语句
- ✅ 移除版权声明和专有信息注释
- ✅ 移除中文开发注释（保留技术文档注释）
- ✅ 清理多余空行

### 文件排除
- 🗑️ 完全删除 `src/services/api/` 目录
- 🗑️ 排除 `server/` 后端代码
- 🗑️ 排除 `CLAUDE.md` 内部文档
- 🗑️ 排除 `.claude/` 配置文件
- 🗑️ 排除同步脚本本身

### 配置更新
- 📦 更新 `package.json` 许可证为 Apache-2.0
- 📦 更新作者信息为 YiNian
- 📋 更新 `manifest.json` 项目信息

## 🔄 同步过程

```
私有仓库 (wdwxedit-v3)
    ↓ 创建 Release
GitHub Actions 触发
    ↓ 拉取代码到临时空间
清理脚本执行
    ↓ 移除敏感信息
构建生产版本
    ↓ npm run build
同步到公开仓库
    ↓ 推送清理后的代码
公开仓库 (WDWXEdit) 
    ↓ 创建对应 Release
✅ 同步完成
```

## ⚠️ 注意事项

1. **Token 安全**：
   - Personal Access Token 具有高级权限，请妥善保管
   - 不要在代码中硬编码 Token
   - 定期更新 Token

2. **同步确认**：
   - 首次配置后建议手动测试同步功能
   - 检查公开仓库是否正确排除了敏感信息

3. **Release 命名**：
   - 建议使用语义化版本命名 (如 v1.0.0)
   - Release 名称和描述会同步到公开仓库

4. **错误处理**：
   - 如果同步失败，查看 Actions 页面的详细日志
   - 常见问题：Token 权限不足、仓库名称错误

## 🛠️ 故障排查

### 同步失败常见原因

1. **Token 权限不足**
   - 确保 Token 有 `repo` 和 `workflow` 权限
   - 检查 Token 是否过期

2. **仓库地址错误**
   - 确认 `PUBLIC_REPO_URL` 格式：`username/repository-name`
   - 不要包含 `https://github.com/`

3. **分支不存在**
   - 确保私有仓库有 `wdwxedit-v3` 分支
   - 确保公开仓库有 `main` 分支

### 查看同步日志

1. 访问私有仓库 Actions 页面
2. 点击具体的 workflow run
3. 查看详细执行日志
4. 根据错误信息进行调试

## 📞 技术支持

如果遇到配置问题：
1. 检查本文档的配置步骤
2. 查看 Actions 执行日志
3. 确认所有 Secrets 配置正确
4. 验证 Token 权限和有效性

---

配置完成后，你就可以专注于私有仓库的开发，GitHub Actions 会自动处理开源版本的发布！