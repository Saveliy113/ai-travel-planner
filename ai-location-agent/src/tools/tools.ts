import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { locationMcpToolInputSchema } from '../interfaces/location.interface';
import LocationService from '../services/location.service';

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
      const data = await locationService.getLocation({
        destination: args.destination,
        lat: args.lat,
        lon: args.lon,
        categories: args.categories,
      });

      return {
        content: [{ type: 'text', text: JSON.stringify(data) }],
      };
    },
  );
}

export { registerMcpTools };
