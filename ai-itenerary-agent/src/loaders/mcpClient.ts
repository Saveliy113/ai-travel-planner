import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

import { logger } from '../utils/logger';

const AI_WEATHER_AGENT_URL = process.env.AI_WEATHER_AGENT_URL;
if (!AI_WEATHER_AGENT_URL) {
  logger.error('[ERROR] [loaders] [mcpClient] Fatal: AI_WEATHER_AGENT_URL is not set');
  process.exit(1);
}

const AI_LOCATION_AGENT_URL = process.env.AI_LOCATION_AGENT_URL;
if (!AI_LOCATION_AGENT_URL) {
  logger.error('[ERROR] [loaders] [mcpClient] Fatal: AI_LOCATION_AGENT_URL is not set');
  process.exit(1);
}

let weatherAgentClient: Client;
(async () => {
  try {
    const transport = new StreamableHTTPClientTransport(new URL(`${AI_WEATHER_AGENT_URL}/mcp`), {
      requestInit: {
        headers: {
          accept: 'application/json, text/event-stream',
        },
      },
    });
    weatherAgentClient = new Client({
      name: 'weather-agent',
      version: '1.0.0',
    });
    await weatherAgentClient.connect(transport);
    logger.info('🌤️ Connected to weather agent (Streamable HTTP)');
  } catch (error) {
    logger.error(`[MCP Client] Error connecting to weather agent: ${error}`);
  }
})();

let locationAgentClient: Client;
(async () => {
  try {
    const transport = new StreamableHTTPClientTransport(new URL(`${AI_LOCATION_AGENT_URL}/mcp`), {
      requestInit: {
        headers: {
          accept: 'application/json, text/event-stream',
        },
      },
    });
    locationAgentClient = new Client({
      name: 'location-agent',
      version: '1.0.0',
    });
    await locationAgentClient.connect(transport);
    logger.info('📍 Connected to location agent (Streamable HTTP)');
  } catch (error) {
    logger.error(`[MCP Client] Error connecting to location agent: ${error}`);
  }
})();

export { locationAgentClient, weatherAgentClient };
