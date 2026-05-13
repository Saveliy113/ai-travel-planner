import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';

import { registerMcpTools } from '../tools/tools';

const transports = new Map<string, SSEServerTransport>();

// Creating MCP Server
const server = new McpServer({
  name: 'weather-service',
  version: '1.0.0',
});

// Registering MCP Tools
registerMcpTools(server);

export { server, transports };
