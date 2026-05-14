import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { locationMcpToolInputSchema } from '../interfaces/location.interface';
import LocationService from '../services/location.service';

function registerMcpTools(server: McpServer): void {
  const locationService = new LocationService();

  server.registerTool(
    'get_poi',
    {
      description:
        'Find points of interest near coordinates using Google Places: expands categories via LLM, then returns ranked places per category for the given destination and lat/lon.',
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
