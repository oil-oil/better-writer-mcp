#!/usr/bin/env -S node --enable-source-maps
// Streamable HTTP transport variant for testing/debugging via MCP Inspector or HTTP clients.
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express, { Request, Response } from 'express';
import { buildServer } from './shared-server.js';

const server = await buildServer();

const app = express();
app.use(express.json());

app.post('/mcp', async (req: Request, res: Response) => {
  try {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    res.on('close', () => transport.close());
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('Error handling MCP request:', error);
    if (!res.headersSent) {
      res.status(500).json({ jsonrpc: '2.0', error: { code: -32603, message: 'Internal server error' }, id: null });
    }
  }
});

const port = parseInt(process.env.PORT || '3000', 10);
app.listen(port, () => {
  console.log(`Better Writer MCP running on http://localhost:${port}/mcp`);
}).on('error', (err: unknown) => {
  console.error('Server error:', err);
  process.exit(1);
});
