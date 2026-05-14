import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

import { logger } from '../utils/logger';

const GOOGLE_MAPS_API_KEY =
  process.env.GOOGLE_MAPS_API_KEY?.trim() || process.env.GOOGLE_PLACES_API_KEY?.trim();
if (!GOOGLE_MAPS_API_KEY) {
  logger.error(
    '[ERROR] [loaders] [mcpClient] Fatal: set GOOGLE_MAPS_API_KEY (or GOOGLE_PLACES_API_KEY) for Google Maps MCP',
  );
  process.exit(1);
}

let googleMapsMcpClient: Client;

(async () => {
  try {
    const transport = new StdioClientTransport({
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-google-maps'],
      env: {
        GOOGLE_MAPS_API_KEY,
      },
    });

    googleMapsMcpClient = new Client({
      name: 'location-agent-google-maps-mcp',
      version: '1.0.0',
    });

    await googleMapsMcpClient.connect(transport);
    logger.info('🗺️ Connected to Google Maps MCP');
  } catch (error) {
    logger.error(`[MCP Client] Error connecting to Google Maps MCP: ${error}`);
  }
})();

export { googleMapsMcpClient };
