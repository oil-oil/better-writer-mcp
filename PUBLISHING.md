# 发布到 npm 指南

## 📋 发布前检查清单

在发布之前，请确保完成以下步骤：

### 1. 修改 package.json 中的信息

```json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/YOUR_USERNAME/better-writer-mcp.git"
  },
  "bugs": {
    "url": "https://github.com/YOUR_USERNAME/better-writer-mcp/issues"
  },
  "homepage": "https://github.com/YOUR_USERNAME/better-writer-mcp#readme"
}
```

将 `YOUR_USERNAME` 替换为您的 GitHub 用户名。

### 2. 确保代码已推送到 GitHub

```bash
# 初始化 git（如果还没有）
git init

# 添加远程仓库
git remote add origin https://github.com/YOUR_USERNAME/better-writer-mcp.git

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit"

# 推送到 GitHub
git push -u origin main
```

## 🚀 发布步骤

### 第一步：注册 npm 账号

如果您还没有 npm 账号：

1. 访问 [npmjs.com](https://www.npmjs.com/) 注册账号
2. 验证邮箱

### 第二步：登录 npm

```bash
npm login
```

按提示输入：
- Username（用户名）
- Password（密码）
- Email（邮箱）
- OTP（如果启用了两步验证）

### 第三步：检查包名是否可用

```bash
npm view better-writer-mcp
```

如果显示 `npm ERR! 404 Not Found`，说明包名可用。

如果包名已被占用，需要在 `package.json` 中修改为其他名称，例如：
- `@your-username/better-writer-mcp`（scoped package）
- `better-writer-mcp-server`

### 第四步：构建项目

```bash
npm run build
```

确保 `dist` 目录已生成且没有错误。

### 第五步：测试包内容

检查即将发布的文件：

```bash
npm pack --dry-run
```

这会显示将要包含在包中的所有文件。确保：
- ✅ 包含 `dist/` 目录
- ✅ 包含 `README.md`
- ✅ 包含 `LICENSE`
- ❌ 不包含 `src/`（源代码）
- ❌ 不包含 `node_modules/`

### 第六步：本地测试安装

创建一个测试包：

```bash
npm pack
```

这会生成一个 `.tgz` 文件。然后在另一个目录测试安装：

```bash
mkdir test-install
cd test-install
npm init -y
npm install ../better-writer-mcp-0.1.0.tgz
```

测试是否可以正常运行：

```bash
npx better-writer-mcp
```

### 第七步：发布到 npm

```bash
npm publish
```

如果使用 scoped package（`@username/package-name`），需要：

```bash
# 公开发布（免费）
npm publish --access public

# 私有发布（需要付费账户）
npm publish --access restricted
```

### 第八步：验证发布

1. 访问 `https://www.npmjs.com/package/better-writer-mcp` 查看包页面
2. 尝试安装：
   ```bash
   npm install -g better-writer-mcp
   ```

## 🔄 发布新版本

### 1. 更新版本号

使用 npm 的版本管理命令：

```bash
# 补丁版本（bug 修复）：0.1.0 -> 0.1.1
npm version patch

# 次要版本（新功能，向后兼容）：0.1.1 -> 0.2.0
npm version minor

# 主要版本（破坏性更改）：0.2.0 -> 1.0.0
npm version major
```

这会自动：
- 更新 `package.json` 中的版本号
- 创建一个 git tag
- 提交更改

### 2. 推送到 GitHub

```bash
git push && git push --tags
```

### 3. 发布新版本

```bash
npm publish
```

## 📊 版本管理建议

遵循[语义化版本](https://semver.org/lang/zh-CN/)规范：

- **主版本号（Major）**：不兼容的 API 修改
- **次版本号（Minor）**：向下兼容的功能性新增
- **修订号（Patch）**：向下兼容的问题修正

示例：
- `0.1.0` -> `0.1.1`：修复 bug
- `0.1.1` -> `0.2.0`：添加 `outputFilePath` 功能
- `0.2.0` -> `1.0.0`：稳定版本发布

## 🛡️ 安全建议

1. **启用两步验证**：在 npm 账户设置中启用 2FA
2. **使用 .npmrc**：不要在代码中包含 npm token
3. **审查依赖**：定期运行 `npm audit` 检查安全漏洞
4. **使用 CI/CD**：配置 GitHub Actions 自动化发布流程

## 🐛 常见问题

### 问题：发布时提示包名已存在

**解决方案**：
1. 更改包名
2. 或使用 scoped package：`@your-username/better-writer-mcp`

### 问题：发布后用户安装报错

**解决方案**：
1. 检查 `package.json` 的 `files` 字段是否包含所有必要文件
2. 确保 `main` 和 `bin` 路径正确
3. 测试 `npm pack` 的输出

### 问题：需要撤销已发布的版本

**注意**：npm 不推荐撤销包，但可以在发布后 72 小时内撤销：

```bash
npm unpublish better-writer-mcp@0.1.0
```

更好的做法是发布一个修复版本：

```bash
npm version patch
npm publish
```

## 📝 发布清单

- [ ] 更新 `package.json` 中的 repository、bugs、homepage
- [ ] 确保 README.md 完整且准确
- [ ] 创建 LICENSE 文件
- [ ] 运行 `npm run build` 成功
- [ ] 运行 `npm pack --dry-run` 检查文件
- [ ] 本地测试安装
- [ ] 更新版本号（如果不是首次发布）
- [ ] 提交并推送到 GitHub
- [ ] 运行 `npm publish`
- [ ] 验证 npm 页面
- [ ] 测试全局安装

---

祝发布顺利！🎉



