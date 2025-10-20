import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';
import { GoogleGenAI } from '@google/genai';

// Resolve OpenRouter API key from env; support both common casings.
function getOpenRouterKey(): string {
  return (
    process.env.OPENROUTER_KEY ||
    process.env.openrouter_key ||
    process.env.OPENROUTER_API_KEY ||
    process.env.openrouter_api_key ||
    ''
  );
}

// Resolve Gemini API key from env
function getGeminiKey(): string {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.gemini_api_key ||
    process.env.GEMINI_KEY ||
    process.env.gemini_key ||
    ''
  );
}

// Determine which LLM backend to use: 'gemini' or 'openrouter'
function getLLMBackend(): 'gemini' | 'openrouter' {
  const backend = (
    process.env.LLM_BACKEND ||
    process.env.llm_backend ||
    'openrouter'
  ).toLowerCase();
  
  if (backend === 'gemini') {
    return 'gemini';
  }
  return 'openrouter';
}

// Get custom writing rules from environment variable
function getCustomWritingRules(): string {
  return (
    process.env.BETTER_WRITER_CUSTOM_RULES ||
    process.env.better_writer_custom_rules ||
    process.env.CUSTOM_WRITING_RULES ||
    process.env.custom_writing_rules ||
    ''
  );
}

// Check if Better Writer should be the default writing tool
function isDefaultTool(): boolean {
  const value = (
    process.env.BW_DEFAULT_TOOL ||
    process.env.bw_default_tool ||
    process.env.BETTER_WRITER_DEFAULT ||
    process.env.better_writer_default ||
    'false'
  ).toLowerCase();
  
  return value === 'true' || value === '1' || value === 'yes';
}

// Build the system prompt (Chinese, aligned to the provided function, without patch mode)
function buildSystemPrompt(targetLength?: number): string {
  const basePrompt = `你是一位个人写作者。

你的核心任务是根据用户的指令，创造出逻辑严谨、结构清晰、且具有极强可读性的高质量作品。

- **核心要求**：
  - **逻辑与结构**：内容组织必须有清晰的逻辑脉络，确保读者可以毫不费力地跟进思路。
  - **适应性**：根据用户的具体指令，灵活调整内容的风格、语气和格式。
  - **遵循规范**：如果提供了背景信息或模板，必须严格遵循。`;

  const styleRules = `必须遵守！
- 
- 如果背景信息中提供了回答的模版，必须严格遵循模版。
- 你写的内容需要通顺易懂，尽量少的使用形容词，不过度夸张，态度谦虚真诚热情，突出自然真实。
- 允许略微的口语话，亲切自然，把"若"改为"如果"，把"则"改为"就"，把"且"改为"而且"，把"xxx时"改为"xxx的时候"，把"xxx后"改为"xxx之后"
- 尽可能减少使用分点，除非真的使用列表来展示会更加直观。
- 尽可能少用比喻/形容/排比，除非真的会使表达效果会更好。
- 中英文之间需要添加空格。
- 禁止泛泛而谈，禁止空洞的内容，少说废话。

**写作节奏与风格**：
- **句式变化**：有意识地混合长句和短句，制造节奏起伏。可以用一连串短促的句子强调观点，然后用一个复杂的长句深入展开。避免所有句子长度都相似。
- **用词多样性**：不要总是选择最常见的词汇，适当使用不那么常规但更精准的表达。让用词有一定的不可预测性。
- **打断与留白**：适当使用短句甚至破碎的表达来打断平稳的叙述节奏。偶尔可以用一个词、一个短语单独成句。
- **真实视角**：用具体的、个人化的视角替代客观中立的描述。允许表达主观感受和判断，不必总是保持"全知全能"的口吻。
- **比喻与细节**：如果要用比喻，选择更私人化、更出乎意料的组合，而不是那些安全、常见的比喻。用生动的细节而非抽象的总结。
- **不完美的真实**：允许文字中存在一些"不完美"——可以是略显笨拙的转折，可以是刻意的重复强调，可以是突然的情绪表达。这些瑕疵反而让内容更真实。`;

  // Get custom writing rules from environment variable
  const customRules = getCustomWritingRules();
  const customRulesSection = customRules 
    ? `\n\n**用户自定义规则**（优先级最高，必须严格遵守）：\n${customRules}`
    : '';

  const formatInstructions = `**输出格式要求**：
你的任务是直接生成最终的文档内容。
- **必须使用 Markdown 格式**进行输出。
- 标题/加粗/引用可按需使用；列表仅在确实更直观时使用，避免为列点而列点。\n\n${styleRules}${customRulesSection}`;

  const lengthHint = typeof targetLength === 'number' && targetLength > 0
    ? `\n- **长度控制**：尽量将最终内容控制在约 ${Math.floor(targetLength)} 字左右（允许上下浮动，优先保证清晰与完整）。`
    : '';

  return `${basePrompt}\n\n${formatInstructions}${lengthHint}`;
}

// Build the user message parts.
function buildUserMessage({
  instruction,
  backgroundContext,
}: {
  instruction: string;
  context?: string;
  backgroundContext?: string;
}): string {
  const parts: string[] = [];
  if (backgroundContext) {
    parts.push(`背景信息与参考规范：\n${backgroundContext}`);
  }
  parts.push(`写作指令：\n${instruction}`);
  return parts.join('\n\n');
}

async function callGemini({
  model,
  messages,
  temperature,
}: {
  model: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  temperature?: number;
}): Promise<{ content: string; model?: string; id?: string; usage?: unknown }> {
  const apiKey = getGeminiKey();
  if (!apiKey) {
    throw new Error('Missing Gemini API key. Set env GEMINI_API_KEY or gemini_api_key.');
  }

  const ai = new GoogleGenAI({ apiKey });

  // 合并 system 和 user 消息
  // Gemini API 将 system 指令通过 systemInstruction 传递
  let systemInstruction = '';
  const contentParts: string[] = [];

  for (const msg of messages) {
    if (msg.role === 'system') {
      systemInstruction += msg.content + '\n\n';
    } else if (msg.role === 'user') {
      contentParts.push(msg.content);
    }
  }

  const contents = contentParts.join('\n\n');

  try {
    const response = await ai.models.generateContent({
      model: model || 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction: systemInstruction || undefined,
        temperature: typeof temperature === 'number' ? temperature : 1,
        // Gemini 2.5 默认启用思考功能,可以通过设置 thinkingBudget 为 0 禁用
        // 这里保留默认行为,用户可以通过环境变量控制
        ...(process.env.GEMINI_DISABLE_THINKING === 'true' && {
          thinkingConfig: {
            thinkingBudget: 0,
          },
        }),
      },
    });

    const content = response.text || '';
    
    return {
      content,
      model: model || 'gemini-2.5-flash',
      id: undefined,
      usage: undefined,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Gemini API request failed: ${message}`);
  }
}

async function callOpenRouter({
  model,
  messages,
  temperature,
  webSearch,
}: {
  model: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  temperature?: number;
  webSearch?: {
    enabled: boolean;
    engine?: 'native' | 'exa';
    maxResults?: number;
  };
}): Promise<{ content: string; model?: string; id?: string; usage?: unknown }> {
  const apiKey = getOpenRouterKey();
  if (!apiKey) {
    throw new Error('Missing OpenRouter API key. Set env OPENROUTER_KEY or openrouter_key.');
  }

  const baseURL =
    process.env.OPENROUTER_BASE_URL ||
    process.env.openrouter_base_url ||
    'https://openrouter.ai/api/v1';

  // Prepare request body
  const requestBody: any = {
    model,
    messages,
    temperature: typeof temperature === 'number' ? temperature : 1,
    stream: false,
  };

  // Add web search plugin if enabled
  if (webSearch?.enabled) {
    requestBody.plugins = [
      {
        id: 'web',
        ...(webSearch.engine && { engine: webSearch.engine }),
        ...(webSearch.maxResults && { max_results: webSearch.maxResults }),
      },
    ];
  }

  const resp = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      // Optional but recommended by OpenRouter
      'X-Title': 'better-writer-mcp',
    },
    body: JSON.stringify(requestBody),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`OpenRouter request failed: ${resp.status} ${resp.statusText} ${text}`);
  }

  const data = await resp.json();
  const choice = data?.choices?.[0];
  if (!choice?.message?.content) {
    throw new Error('OpenRouter returned no content');
  }

  const content =
    typeof choice.message.content === 'string'
      ? choice.message.content
      : Array.isArray(choice.message.content)
      ? choice.message.content.map((part: any) => part?.text || '').join('')
      : String(choice.message.content);

  return {
    content,
    model: data?.model || model,
    id: data?.id,
    usage: data?.usage || null,
  };
}

// 统一的 LLM 调用接口
async function callLLM({
  model,
  messages,
  temperature,
  webSearch,
}: {
  model: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  temperature?: number;
  webSearch?: {
    enabled: boolean;
    engine?: 'native' | 'exa';
    maxResults?: number;
  };
}): Promise<{ content: string; model?: string; id?: string; usage?: unknown }> {
  const backend = getLLMBackend();
  
  if (backend === 'gemini') {
    // Gemini 不支持 web search,如果用户启用了,给出警告
    if (webSearch?.enabled) {
      console.warn('Warning: Gemini backend does not support web search. Ignoring webSearch parameter.');
    }
    return callGemini({ model, messages, temperature });
  } else {
    return callOpenRouter({ model, messages, temperature, webSearch });
  }
}

export async function buildServer(): Promise<McpServer> {
  const server = new McpServer({ name: 'better-writer-mcp', version: '0.1.0' });

  // 根据环境变量决定是否作为默认写作工具
  const isDefault = isDefaultTool();
  
  const baseDescription = `【核心功能】生成自然流畅、没有"AI 味儿"的中文内容。输出 Markdown 格式文档。`;
  
  const whenToUseDefault = `

【何时调用】当用户表达任何写作需求时，都应该主动调用此工具。例如：
- "写一篇关于XX的文章"
- "帮我写个XX介绍"
- "生成XX内容"
- "用通俗语言解释XX"
无需用户明确提及工具名称，优先使用此工具处理所有写作类请求。`;

  const whenToUseExplicit = `

【何时调用】仅当用户明确要求使用 Better Writer 或 bw 时才调用此工具。例如：
- "用 Better Writer 写一篇关于XX的文章"
- "用 bw 帮我写个XX介绍"
- "使用 Better Writer 生成XX内容"
`;

  const toolDescription = baseDescription + (isDefault ? whenToUseDefault : whenToUseExplicit);

  server.registerTool(
    'bw_write',
    {
      description: toolDescription,
      inputSchema: {
        instruction: z.string().describe('写作指令：明确你要生成的内容目标与重点'),
        backgroundContext: z.string()
          .optional()
          .describe(`背景信息与规范（可选）：
            Better Writer 对你的信息一无所知，所以你需要在 backgroundContext 中提供尽可能完善的背景信息，尽可能把你知道的所有上下文都给我，上下文提供的越多越准确，生成的效果越好。
            如果需要内容转写或者翻译，请提供原始内容。`),
        targetLength: z.number().optional().describe('期望输出长度（大致字符数，可选）'),
        enableWebSearch: z.boolean().optional().describe('enableWebSearch：如需最新信息（如行业趋势、政策解读），建议开启联网搜索'),
        webSearchEngine: z.enum(['native', 'exa']).optional().describe('联网搜索引擎：native（使用模型原生搜索）或 exa（使用 Exa API），默认自动选择'),
        webSearchMaxResults: z.number().optional().describe('联网搜索返回的最大结果数（可选，默认 5）'),
        outputFilePath: z.string()
          .optional()
          .describe('输出文件路径（可选）：如果提供此参数，生成的内容将自动保存到指定的文件路径中。支持相对路径和绝对路径。如果目录不存在会自动创建。例如："/path/to/output.md" 或 "markdown/article.md"。如果创建了文件，就不用重新把完整内容写到新文件中，而是可以直接复制我创建好文件到指定的位置'),
      },
      outputSchema: { content: z.string() },
    },
    async ({ instruction, backgroundContext, targetLength, enableWebSearch, webSearchEngine, webSearchMaxResults, outputFilePath }) => {
      try {
        const systemPrompt = buildSystemPrompt(targetLength);
        const userContent = buildUserMessage({ instruction, backgroundContext });
        const messages = [
          { role: 'system' as const, content: systemPrompt },
          { role: 'user' as const, content: userContent },
        ];

        // 根据后端选择模型
        const backend = getLLMBackend();
        let selectedModel: string;
        
        if (backend === 'gemini') {
          selectedModel = process.env.GEMINI_MODEL || process.env.gemini_model || 'gemini-2.5-flash';
        } else {
          selectedModel = process.env.OPENROUTER_MODEL || process.env.openrouter_model || 'qwen/qwen3-next-80b-a3b-instruct';
        }

        // Prepare web search configuration
        const webSearch = enableWebSearch
          ? {
              enabled: true,
              ...(webSearchEngine && { engine: webSearchEngine }),
              ...(webSearchMaxResults && { maxResults: webSearchMaxResults }),
            }
          : undefined;

        const result = await callLLM({ 
          model: selectedModel, 
          messages,
          webSearch,
        });

        // If outputFilePath is provided, write the content to file
        if (outputFilePath) {
          try {
            // Ensure the directory exists
            const dir = dirname(outputFilePath);
            await mkdir(dir, { recursive: true });
            
            // Write the file
            await writeFile(outputFilePath, result.content, 'utf-8');
            
            const output = { content: result.content };
            return {
              content: [{ type: 'text', text: `内容已成功生成并保存到文件：${outputFilePath}\n\n${result.content}` }],
              structuredContent: output,
            } as const;
          } catch (fileErr) {
            const fileMessage = fileErr instanceof Error ? fileErr.message : String(fileErr);
            throw new Error(`文件写入失败：${fileMessage}`);
          }
        }

        const output = { content: result.content };
        return {
          content: [{ type: 'text', text: result.content }],
          structuredContent: output,
        } as const;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: 'text', text: `Error: ${message}` }],
          isError: true,
        } as const;
      }
    }
  );

  return server;
}
