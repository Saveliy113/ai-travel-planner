import axios from 'axios';
import { plainToInstance } from 'class-transformer';
import moment from 'moment';

import { LocationQueryDto } from '../dtos/location.dto';
import type { LocationDailyData, LocationDataMode, LocationQueryResult, OpenMeteoLocationApiResponse } from '../interfaces/open-meteo-location.interface';

import { logger } from '../utils/logger';

class LocationService {
  private fetchLocationDailyData = async (mode: LocationDataMode, dto: LocationQueryDto): Promise<LocationQueryResult> => {
    try {
      const { data: payload } = await axios.get<OpenMeteoLocationApiResponse>(`${mode === 'forecast' ? process.env.OPEN_METEO_API_URL_FORECAST : process.env.OPEN_METEO_API_URL_ARCHIVE}/${mode}`, {
        params: {
          latitude: dto.lat,
          longitude: dto.lon,
          timezone: 'auto',
          daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,weather_code',
          ...(mode === 'archive' ? { start_date: dto.startDate, end_date: dto.endDate } : {}),
          ...(mode === 'forecast' ? { forecast_days: 16 } : {}),
        },
      });

      return ({
        mode,
        units: payload.daily_units,
        daily: payload.daily.time.map((time, index) => ({
          time,
          temperature_2m_max: payload.daily.temperature_2m_max[index],
          temperature_2m_min: payload.daily.temperature_2m_min[index],
          precipitation_sum: payload.daily.precipitation_sum[index],
          precipitation_probability_max: payload.daily.precipitation_probability_max[index],
          wind_speed_10m_max: payload.daily.wind_speed_10m_max[index],
        })),
      });
    } catch (error) {
      logger.error(
        `[LocationService] fetchLocationDailyData: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  public async getLocation(query: Record<string, unknown>): Promise<LocationQueryResult> {
    try {
  
      return response;
    } catch (error) {
      logger.error(
        `[LocationService] getLocation: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }
}

export default LocationService;
