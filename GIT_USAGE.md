# GitHub 使用说明

## 首次设置

代码已经成功上传到 GitHub 仓库：
- **仓库地址**: https://github.com/NoraStuart22/secure-trade-wallet
- **Git 用户**: NoraStuart22
- **邮箱**: yesfq2846343@outlook.com

## 自动推送脚本

已创建自动推送脚本 `push-to-github.ps1`，可以快速将更改推送到 GitHub。

### 使用方法

1. **使用默认提交信息**（自动包含时间戳）：
   ```powershell
   .\push-to-github.ps1
   ```

2. **使用自定义提交信息**：
   ```powershell
   .\push-to-github.ps1 -CommitMessage "Your custom commit message"
   ```

### 脚本功能

- ✅ 自动检查是否有更改
- ✅ 添加所有更改的文件
- ✅ 自动提交（带时间戳或自定义消息）
- ✅ 拉取远程最新更改（如果需要）
- ✅ 推送到 GitHub
- ✅ 显示推送结果

## 手动推送

如果需要手动控制推送过程：

```powershell
# 1. 查看状态
git status

# 2. 添加文件
git add .

# 3. 提交
git commit -m "Your commit message"

# 4. 推送
git push origin main
```

## 重要提示

⚠️ **安全提醒**：
- `.env` 文件已添加到 `.gitignore`，不会被提交
- 敏感信息（如 API keys、私钥）不应提交到仓库
- Personal Access Token 已配置在远程仓库 URL 中

## 常见问题

### 1. 推送失败：远程有新的更改
```powershell
# 先拉取远程更改
git pull origin main --allow-unrelated-histories

# 解决冲突后推送
git push origin main
```

### 2. 忘记提交某些文件
```powershell
# 添加特定文件
git add <filename>

# 或添加所有更改
git add .

# 然后提交和推送
git commit -m "Add missing files"
git push origin main
```

### 3. 撤销最后一次提交（但保留更改）
```powershell
git reset --soft HEAD~1
```

## 仓库信息

- **GitHub 仓库**: https://github.com/NoraStuart22/secure-trade-wallet
- **分支**: main
- **远程名称**: origin

