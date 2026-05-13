import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { forecastQuerySchema } from '../dtos/forecast.dto';
import ForecastService from '../services/forecast.service';

function registerMcpTools(server: McpServer): void {
  const forecastService = new ForecastService();

  server.registerTool(
    'get_forecast',
    {
      description:
        'Returns daily Open-Meteo fields (temperature max/min, precipitation sum, max precipitation probability, max wind) for the given coordinates and inclusive YYYY-MM-DD range. If both start and end fall on or after today and on or before today plus 16 days, it uses the 16-day forecast endpoint and keeps only days inside your range. Otherwise it uses the archive endpoint: for the same month-day span it requests up to three consecutive calendar years (the anchor year shifts down by one when the current month is before the trip end month), concatenates those series, then collapses them into one day-by-day series for your original dates by averaging each metric across years that share the same calendar month-day.',
      inputSchema: forecastQuerySchema,
    },
    async (args) => {
      const data = await forecastService.getForecasts(args);

      return {
        content: [{ type: 'text', text: JSON.stringify(data) }],
      };
    },
  );
}

export { registerMcpTools };
