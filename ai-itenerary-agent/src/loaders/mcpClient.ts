import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { logger } from '../utils/logger';

const AI_WEATHER_AGENT_URL = process.env.AI_WEATHER_AGENT_URL;
if (!AI_WEATHER_AGENT_URL) {
    logger.error('[ERROR] [loaders] [mcpClient] Fatal: AI_WEATHER_AGENT_URL is not set');
    process.exit(1);
}


let weatherAgentClient: Client;
(async () => {
    try {
        const transport = new SSEClientTransport(new URL(`${AI_WEATHER_AGENT_URL}/mcp/sse`));
        weatherAgentClient = new Client({
            name: 'weather-agent',
            version: '1.0.0',
        });
        await weatherAgentClient.connect(transport);
        const { tools: weatherTools } = await weatherAgentClient.listTools();
        logger.info(`🌤️ Tools: ${JSON.stringify(weatherTools)}`);
        logger.info('🌤️ Connected to weather agent');
    } catch (error) {
        logger.error(`[MCP Client] Error connecting to weather agent: ${error}`);
    }
})();

export { weatherAgentClient };