import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import ForecastService from '../services/forecast.service';

const forecastInputSchema = {
  lat: z.number().describe('Latitude (WGS84)'),
  lon: z.number().describe('Longitude (WGS84)'),
  startDate: z.string().describe('Start date of the period (YYYY-MM-DD)'),
  endDate: z.string().describe('End date of the period (YYYY-MM-DD)'),
};

function registerMcpTools(server: McpServer): void {
  const forecastService = new ForecastService();

  server.registerTool(
    'get_forecast',
    {
      description:
        'Return daily weather (Open-Meteo) for the given coordinates and inclusive date range. Uses forecast API for near-term dates and historical averaging for past/climatology-style ranges.',
      inputSchema: forecastInputSchema,
    },
    async (args) => {
      const data = await forecastService.getForecasts({
        lat: args.lat,
        lon: args.lon,
        startDate: args.startDate,
        endDate: args.endDate,
      });

      return {
        content: [{ type: 'text', text: JSON.stringify(data) }],
      };
    },
  );
}

export { registerMcpTools };
