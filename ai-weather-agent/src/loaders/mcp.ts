import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';

import { registerMcpTools } from '../tools/tools';
import { logger } from '../utils/logger';

const transports = new Map<string, SSEServerTransport>();

// Creating MCP Server
const server = new McpServer({
  name: 'weather-service',
  version: '1.0.0',
});
logger.info(`🌤️  MCP Server Initialized`);

// Registering MCP Tools
registerMcpTools(server);

export { server, transports };
