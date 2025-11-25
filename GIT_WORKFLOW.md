# Git Workflow Guide

## 初始设置（已完成）

✅ Git 用户信息已配置
✅ 远程仓库已设置
✅ 代码已提交并推送

## 日常使用：提交和推送更改

### 方法 1：使用 Git 命令（推荐）

```bash
# 1. 查看更改状态
git status

# 2. 添加所有更改
git add .

# 3. 提交更改（使用有意义的提交信息）
git commit -m "描述你的更改"

# 4. 推送到 GitHub
git push origin main
```

### 方法 2：使用提供的脚本

创建一个 PowerShell 脚本 `push-changes.ps1`：

```powershell
# 添加所有更改
git add .

# 提交（使用当前时间作为默认消息，或手动输入）
$message = Read-Host "Enter commit message (or press Enter for default)"
if ([string]::IsNullOrWhiteSpace($message)) {
    $message = "Update: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
}

git commit -m $message

# 推送到 GitHub
git push origin main

Write-Host "Changes pushed successfully!" -ForegroundColor Green
```

使用方法：
```powershell
.\push-changes.ps1
```

## 提交信息规范

使用清晰的提交信息，格式：

```
类型: 简短描述

详细说明（可选）
```

类型示例：
- `feat:` - 新功能
- `fix:` - 修复 bug
- `docs:` - 文档更新
- `style:` - 代码格式调整
- `refactor:` - 代码重构
- `test:` - 测试相关
- `chore:` - 构建/工具相关

示例：
```bash
git commit -m "feat: Add weekly expense summary feature"
git commit -m "fix: Resolve transaction gas estimation error"
git commit -m "docs: Update setup instructions"
```

## 查看提交历史

```bash
# 查看最近提交
git log --oneline -10

# 查看详细提交历史
git log
```

## 撤销更改

```bash
# 撤销未提交的更改
git checkout -- <文件名>

# 撤销所有未提交的更改
git reset --hard HEAD

# 撤销最后一次提交（保留更改）
git reset --soft HEAD~1
```

## 分支管理（可选）

如果需要开发新功能而不影响主分支：

```bash
# 创建新分支
git checkout -b feature/new-feature

# 在新分支上工作并提交
git add .
git commit -m "feat: Add new feature"
git push origin feature/new-feature

# 切换回主分支
git checkout main

# 合并功能分支
git merge feature/new-feature
git push origin main
```

## 注意事项

⚠️ **重要**：
- 不要提交敏感信息（`.env.local` 已在 `.gitignore` 中）
- 不要提交 `node_modules`、`artifacts`、`cache` 等（已在 `.gitignore` 中）
- 提交前检查 `git status` 确保只提交需要的文件
- 定期推送更改，避免本地和远程差异过大

## 故障排除

### 推送被拒绝
```bash
# 先拉取远程更改
git pull origin main

# 解决冲突后再次推送
git push origin main
```

### 忘记提交某些文件
```bash
# 添加遗漏的文件
git add <文件名>

# 修改最后一次提交
git commit --amend --no-edit

# 强制推送（谨慎使用）
git push origin main --force
```

## 自动化推送（可选）

可以设置 Git hooks 自动推送，但不推荐，因为：
- 可能推送未完成的代码
- 无法控制提交信息
- 可能推送敏感信息

建议手动控制提交和推送过程。

