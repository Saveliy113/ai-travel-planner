import { z } from 'zod';

const ymd = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD');

/** Query / MCP tool input: coordinates + inclusive date range. */
export const forecastQuerySchema = z.object({
  lat: z
    .number()
    .min(-90, 'latitude must be >= -90')
    .max(90, 'latitude must be <= 90')
    .describe('Latitude (WGS84)'),
  lon: z
    .number()
    .min(-180, 'longitude must be >= -180')
    .max(180, 'longitude must be <= 180')
    .describe('Longitude (WGS84)'),
  startDate: ymd.describe('Start date of the period (YYYY-MM-DD, inclusive)'),
  endDate: ymd.describe('End date of the period (YYYY-MM-DD, inclusive)'),
});

export type ForecastQueryDto = z.infer<typeof forecastQuerySchema>;
