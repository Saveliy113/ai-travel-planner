import type { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { registerMcpTools } from '../tools/tools';

const streamableTransports = new Map<string, StreamableHTTPServerTransport>();

/** One MCP server instance per Streamable HTTP session (shared singleton cannot call connect() twice). */
export function createMcpServer(): McpServer {
  const instance = new McpServer({
    name: 'location-service',
    version: '1.0.0',
  });
  registerMcpTools(instance);
  return instance;
}

export { streamableTransports };
