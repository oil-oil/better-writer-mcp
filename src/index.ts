#!/usr/bin/env -S node --enable-source-maps
// MCP server (stdio) in TypeScript exposing a single content-generation tool calling OpenRouter.
// Env: set OPENROUTER_KEY or openrouter_key to your OpenRouter API key.

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { buildServer } from './shared-server.js';

const server = await buildServer();
const transport = new StdioServerTransport();
await server.connect(transport);

