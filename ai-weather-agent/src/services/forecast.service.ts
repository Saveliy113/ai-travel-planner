import axios from 'axios';
import { plainToInstance } from 'class-transformer';
import moment from 'moment';

import { ForecastQueryDto } from '../dtos/forecast.dto';
import type { ForecastResult, OpenMeteoForecastResponse } from '../interfaces/open-meteo-forecast.interface';
import { logger } from '../utils/logger';
class ForecastService {
  private getForecastsData = async (mode: 'forecast' | 'archive', dto: ForecastQueryDto): Promise<ForecastResult> => {
    try {
      const { data: forecasts } = await axios.get<OpenMeteoForecastResponse>(`${process.env.OPEN_METEO_API_URL}/${mode}`, {
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
        units: forecasts.daily_units,
        forecasts: forecasts.daily.time.map((time, index) => ({
          time,
          temperature_2m_max: forecasts.daily.temperature_2m_max[index],
          temperature_2m_min: forecasts.daily.temperature_2m_min[index],
          precipitation_sum: forecasts.daily.precipitation_sum[index],
          precipitation_probability_max: forecasts.daily.precipitation_probability_max[index],
          wind_speed_10m_max: forecasts.daily.wind_speed_10m_max[index],
          weather_code: forecasts.daily.weather_code[index],
        })),
      });
    } catch (error) {
      logger.error(
        `[ForecastService] getForecastsData: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }
  public async getForecasts(query: Record<string, unknown>): Promise<ForecastResult> {
    try {
      const dto = plainToInstance(ForecastQueryDto, query);
      logger.debug(
        `[ForecastService] getForecasts: lat=${dto.lat} lon=${dto.lon} start=${dto.startDate} end=${dto.endDate}`,
      );
  
      let response: ForecastResult | null = null;
      
      // If passed time period is within today + 16 days
      // Fetching the forecast for the period
      const today = moment().startOf('day');
      const lastForecastDay = today.clone().add(16, 'days');
  
      const startDate = moment(dto.startDate);
      const endDate = moment(dto.endDate);

      if (!startDate.isSameOrAfter(today, 'day') && endDate.isSameOrBefore(lastForecastDay, 'day')) {
        // Getting the forecast for 16 days
        response = await this.getForecastsData('forecast', dto);
      } else {
        // Else fetching weather history data for past 3 years
        // And calculating the historical average
        let currentYear = moment().year();
        const currentMonth = moment().month();
        const endDateMonth = moment(endDate).month();
  
        // If current month is before endDate month,
        // then the year is the previous year
        if (currentMonth < endDateMonth) {
          currentYear--;
        }
  
        for (let year = currentYear; year > currentYear - 3; year--) {
          const start = moment(startDate).year(year).format('YYYY-MM-DD');
          const end = moment(endDate).year(year).format('YYYY-MM-DD');
          const weatherHistory = await this.getForecastsData('archive', { ...dto, startDate: start, endDate: end });
  
          const newResponse: ForecastResult = {
            units: weatherHistory.units,
            forecasts: [...(response?.forecasts || []), ...weatherHistory.forecasts],
          };
          response = newResponse;
        }
      }

      if (!response) {
        throw new Error('No data found');
      }

      return response;
    } catch (error) {
      logger.error(
        `[ForecastService] getForecasts: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }

    
  }
}

export default ForecastService;
