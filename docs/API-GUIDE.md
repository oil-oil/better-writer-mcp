# Better Writer MCP 使用指南

### Better Writer MCP 是什么？

这是一个 **MCP (Model Context Protocol) 服务器**，专门用来生成高质量的中文内容。它的核心目的是：**让 AI 生成的中文读起来像人写的，而不是机器生成的**。

它解决的问题是：市面上大部分 AI 写作工具生成的中文都太"公文腔"了，满是"若""则""且"这种生硬的词汇，读起来没有人味儿。

---

### 核心工具：`better_writer_generate`

这个 MCP 服务器注册了一个工具叫 `better_writer_generate`，以下是详细的参数说明：

###### 📝 **工具描述**

```
高质量内容生成工具：当你需要写出自然真实、没有"AI 味儿"的内容时调用。
遵循严格的可读性与风格规范，基于指令/上下文/背景生成 Markdown 文档。

Better Writer 对你的信息一无所知，所以你需要在 backgroundContext 中提供
尽可能完善的背景信息，尽可能把你知道的所有上下文都给我，上下文提供的越
多越准确，生成的效果越好。

outputFilePath 可以用于内容生成后直接创建 md 文件，这样你需要创建 md 
文件，就不用重新把完整内容写到新文件中，而是可以直接复制我创建好文件到
指定的位置
```

---

### 📋 参数详解

###### 1. **`instruction`** ⭐ (必填)
- **类型**: `string`
- **描述**: 写作指令：明确你要生成的内容目标与重点
- **作用**: 这是核心参数，告诉 AI 你要写什么内容
- **示例**:
  ```
  "写一篇介绍 MCP 协议的技术文档，面向前端开发者"
  "用通俗语言总结 2024 年 AI 行业发展趋势"
  "写一份产品功能说明，重点介绍智能推荐算法"
  ```

###### 2. **`backgroundContext`** (可选)
- **类型**: `string`
- **描述**: 背景信息与规范（可选）
- **作用**: 提供上下文、参考资料、特定要求等，上下文越丰富，生成效果越好
- **示例**:
  ```
  "我们公司是做教育 SaaS 的，目标用户是 K12 老师，
   写作风格要求：避免使用'赋能''闭环'等术语，
   多用场景化案例说明"
  ```

###### 3. **`targetLength`** (可选)
- **类型**: `number`
- **描述**: 期望输出长度（大致字符数，可选）
- **作用**: 控制生成内容的长度，不是严格限制，会优先保证内容完整性
- **示例**:
  ```
  1500  // 生成约 1500 字的内容
  800   // 生成约 800 字的短文
  3000  // 生成约 3000 字的长文
  ```

###### 4. **`enableWebSearch`** (可选)
- **类型**: `boolean`
- **描述**: 是否启用联网搜索功能（可选，默认 false）
- **作用**: 开启后，AI 会自动搜索最新信息来丰富内容
- **使用场景**:
  - 写行业趋势分析（需要最新数据）
  - 技术教程（需要最新文档）
  - 政策解读（需要最新政策信息）
- **示例**:
  ```
  true   // 启用联网搜索
  false  // 不联网，仅用模型知识
  ```

###### 5. **`webSearchEngine`** (可选)
- **类型**: `'native' | 'exa'`
- **描述**: 联网搜索引擎：native（使用模型原生搜索）或 exa（使用 Exa API），默认自动选择
- **作用**: 选择搜索引擎类型
  - `native`: 模型内置搜索，速度快
  - `exa`: 专业搜索引擎，结果更权威
- **示例**:
  ```
  "native"  // 用原生搜索
  "exa"     // 用 Exa API
  ```

###### 6. **`webSearchMaxResults`** (可选)
- **类型**: `number`
- **描述**: 联网搜索返回的最大结果数（可选，默认 5）
- **作用**: 控制搜索结果数量，越多越全面但也越慢
- **示例**:
  ```
  3   // 只取前 3 个搜索结果
  5   // 默认值，取 5 个结果
  10  // 取 10 个结果，更全面
  ```

###### 7. **`outputFilePath`** (可选)
- **类型**: `string`
- **描述**: 输出文件路径（可选）：如果提供此参数，生成的内容将自动保存到指定的文件路径中。支持相对路径和绝对路径。如果目录不存在会自动创建。
- **作用**: 自动保存生成的内容到文件，省去复制粘贴
- **支持格式**: `.md`, `.txt` 或任何文本文件
- **示例**:
  ```
  "/Users/you/Documents/article.md"           // 绝对路径
  "markdown/tech-report.md"                   // 相对路径
  "./output/weekly-report-2025-04-05.md"     // 当前目录下
  ```

---

### 🔧 环境变量配置

这些环境变量需要在运行前设置：

| 变量名 | 必填? | 描述 | 示例值 |
|--------|-------|------|--------|
| `OPENROUTER_KEY` | ✅ 必填 | OpenRouter API 密钥 | `sk-abc123xyz...` |
| `OPENROUTER_MODEL` | 可选 | 指定使用的模型 | `qwen/qwen3-next-80b-a3b-instruct` |
| `BW_DEFAULT_TOOL` | 可选 | 是否作为默认写作工具 | `true` / `false` (默认 `false`) |
| `OPENROUTER_BASE_URL` | 可选 | 自定义 API 端点 | `https://openrouter.ai/api/v1` |
| `BETTER_WRITER_CUSTOM_RULES` | 可选 | 自定义写作规则 | `- 所有代码必须有中文注释\n- 不使用'简单'等主观词` |

###### 配置示例

```bash
# 必填：设置 OpenRouter API 密钥
export OPENROUTER_KEY="sk-your-api-key-here"

# 可选：指定使用的模型
export OPENROUTER_MODEL="qwen/qwen3-next-80b-a3b-instruct"

# 可选：设置为默认写作工具（推荐）
export BW_DEFAULT_TOOL="true"

# 可选：自定义写作规则
export BETTER_WRITER_CUSTOM_RULES="
- 所有代码示例必须包含中文注释
- 技术术语首次出现时要给出中文解释
- 避免使用'简单''容易'等主观判断词
- 每个步骤都要说明预期结果
"
```

#### 关于 `BW_DEFAULT_TOOL` 环境变量

这个配置决定了 Better Writer 的触发方式：

**`BW_DEFAULT_TOOL=true`（推荐）**：
- ✅ AI 会在任何写作需求时自动调用 Better Writer
- ✅ 用户只需说"写一篇关于XX的文章"
- ✅ 无需每次都说"用 Better Writer"或"用 bw"
- 📌 适合作为主要写作工具使用

**`BW_DEFAULT_TOOL=false`（默认值）**：
- ⚠️ 只有明确提及工具名称时才会调用
- ⚠️ 用户需要说"用 Better Writer 写..."或"用 bw 写..."
- 📌 适合与其他写作工具共存的场景

在 MCP 配置中使用：
```json
{
  "mcpServers": {
    "bw": {
      "command": "npx",
      "args": ["-y", "better-writer-mcp"],
      "env": {
        "OPENROUTER_KEY": "your-api-key-here",
        "BW_DEFAULT_TOOL": "true"
      }
    }
  }
}
```

---

### 💡 实际使用示例

###### 示例 1：写一篇技术博客

```javascript
{
  "instruction": "介绍 React Server Components 的工作原理",
  "backgroundContext": "面向有 2 年前端经验的开发者，要求通俗易懂，多用代码示例",
  "targetLength": 2000,
  "enableWebSearch": true,
  "webSearchEngine": "native",
  "outputFilePath": "blog/react-server-components.md"
}
```

**输出**: 一篇约 2000 字的技术博客，自动保存到 `blog/react-server-components.md`

---

###### 示例 2：生成产品周报

```javascript
{
  "instruction": "写一份本周产品进展周报",
  "backgroundContext": `
    本周完成：
    - 用户登录模块优化，登录速度提升 30%
    - 新增智能推荐功能，点击率提升 15%
    下周计划：
    - 优化搜索算法
    - 修复已知 bug 5 个
  `,
  "targetLength": 500,
  "outputFilePath": "reports/weekly-2025-04-05.md"
}
```

**输出**: 一份约 500 字的周报，自动保存到 `reports/weekly-2025-04-05.md`

---

###### 示例 3：联网查资料写行业分析

```javascript
{
  "instruction": "分析 2025 年大语言模型在医疗行业的应用现状",
  "enableWebSearch": true,
  "webSearchEngine": "exa",
  "webSearchMaxResults": 10,
  "targetLength": 3000,
  "outputFilePath": "analysis/llm-in-healthcare-2025.md"
}
```

**输出**: 一篇约 3000 字的行业分析报告，包含最新数据，自动保存到 `analysis/llm-in-healthcare-2025.md`

---

###### 示例 4：快速生成产品介绍（最简使用）

```javascript
{
  "instruction": "用通俗语言介绍一款智能台灯产品，强调护眼和智能调光功能"
}
```

**输出**: 直接返回生成的内容，不保存文件

---

###### 示例 5：使用自定义规则写团队文档

```bash
# 先设置自定义规则
export BETTER_WRITER_CUSTOM_RULES="
- 所有 API 接口必须注明请求方法和参数
- 代码示例必须包含错误处理
- 不使用'简单''容易'等主观词汇
"
```

```javascript
{
  "instruction": "写一份用户认证 API 的使用文档",
  "backgroundContext": "RESTful API，支持 JWT 认证，包含登录、注册、刷新 token 三个接口",
  "targetLength": 1200,
  "outputFilePath": "docs/api-authentication.md"
}
```

**输出**: 符合团队规范的 API 文档，自动保存到 `docs/api-authentication.md`

---

### ✨ 核心价值

1. **真正懂中文**: 自动把"若""则""且"改成"如果""就""而且"
2. **避免 AI 味**: 内置严格的写作规范，禁止空话套话
3. **省时省力**: 联网搜索 + 自动保存，一气呵成
4. **高度可定制**: 支持自定义写作规则，适应团队规范
5. **双模式支持**: stdio（命令行）和 HTTP（API）两种方式

---

### 🎯 最佳实践

###### 1. 提供丰富的背景信息
❌ 不好的做法：
```javascript
{
  "instruction": "写一篇关于 AI 的文章"
}
```

✅ 好的做法：
```javascript
{
  "instruction": "写一篇关于 AI 在教育行业应用的文章",
  "backgroundContext": `
    目标读者：K12 学校的校长和教务主任
    重点内容：智能作业批改、个性化学习路径、教学质量分析
    语言风格：通俗易懂，避免技术术语，多用实际案例
    参考案例：某小学使用 AI 作业批改系统后，教师批改时间减少 60%
  `
}
```

###### 2. 合理设置文章长度
- **短文**（500-800 字）：产品介绍、周报、简讯
- **中长文**（1500-2500 字）：技术博客、深度分析、教程
- **长文**（3000+ 字）：行业报告、完整指南、系列文章

###### 3. 善用联网搜索
- 写**时效性内容**时务必开启（政策解读、行业趋势）
- 写**常识性内容**时可以不开启（基础教程、概念解释）
- 使用 `exa` 引擎获取更权威的信息源

###### 4. 利用自定义规则统一团队风格
```bash
# 技术团队示例
export BETTER_WRITER_CUSTOM_RULES="
- 代码必须有注释
- API 必须注明版本
- 禁止使用'很简单''只需要'等词
"

# 产品团队示例
export BETTER_WRITER_CUSTOM_RULES="
- 功能介绍必须配场景
- 禁止使用'赋能''闭环''抓手'
- 数据必须有来源
"
```

---

### 🚀 快速开始

###### 1. 安装
```bash
npm install -g better-writer-mcp
```

###### 2. 配置环境变量
```bash
export OPENROUTER_KEY="your-api-key"
```

###### 3. 开始使用
```bash
# stdio 模式
better-writer-mcp

# HTTP 模式
npm run start:http
```

###### 4. 调用示例（HTTP 模式）
```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "better_writer_generate",
      "arguments": {
        "instruction": "写一篇关于 MCP 协议的介绍",
        "targetLength": 1000,
        "outputFilePath": "mcp-intro.md"
      }
    }
  }'
```

---

### 📚 相关资源

- [MCP 协议规范](https://github.com/modelcontextprotocol/specification)
- [OpenRouter 文档](https://openrouter.ai/docs)
- [Qwen3 模型介绍](https://qwenlm.github.io/)

---

### 🤝 贡献与反馈

如果你在使用过程中遇到问题或有改进建议，欢迎：
- 提交 Issue
- 发起 Pull Request
- 分享你的使用案例

---

**让写作回归自然，让 AI 更懂中文。**

