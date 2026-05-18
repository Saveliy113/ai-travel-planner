import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { locationMcpToolInputSchema } from '../interfaces/location.interface';
import LocationService from '../services/location.service';
import { logger } from '../utils/logger';

function registerMcpTools(server: McpServer): void {
  const locationService = new LocationService();

  server.registerTool(
    'get_poi',
    {
      description:
        'Fetch POIs near lat/lon via Google Places. Pass planner-built `categories` only (name + count per category); the itinerary agent maps user interests to this list.',
      inputSchema: locationMcpToolInputSchema,
    },
    async (args) => {
      const categories = args.categories.map((category) => ({
        searchQuery: category.searchQuery,
        count: category.count,
      }));
      logger.info(`[POI] start · ${categories.length} categories`);
      const data = await locationService.getLocation({ categories });
      logger.info('[POI] done');

      return {
        content: [{ type: 'text', text: JSON.stringify(data) }],
      };
    },
  );
}

export { registerMcpTools };
