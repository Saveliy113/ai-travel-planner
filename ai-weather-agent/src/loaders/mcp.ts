import type { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { registerMcpTools } from '../tools/tools';
import { logger } from '../utils/logger';

const streamableTransports = new Map<string, StreamableHTTPServerTransport>();

const server = new McpServer({
  name: 'weather-service',
  version: '1.0.0',
});
logger.info(`🌤️  MCP Server Initialized`);

registerMcpTools(server);

export { server, streamableTransports };
