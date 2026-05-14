import type { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { registerMcpTools } from '../tools/tools';

const streamableTransports = new Map<string, StreamableHTTPServerTransport>();

const server = new McpServer({
  name: 'location-service',
  version: '1.0.0',
});

registerMcpTools(server);

export { server, streamableTransports };
