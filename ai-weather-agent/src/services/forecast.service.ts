import { plainToInstance } from 'class-transformer';

import { ForecastQueryDto } from '../dtos/forecast.dto';
import { logger } from '../utils/logger';
import moment from 'moment';

export type ForecastResult = {
  lat: number;
  lon: number;
  startDate: string;
  endDate: string;
  forecasts: unknown[];
};

class ForecastService {
  public getForecast(query: Record<string, unknown>): ForecastResult {
    const dto = plainToInstance(ForecastQueryDto, query);
    logger.debug(
      `[ForecastService] getForecast: lat=${dto.lat} lon=${dto.lon} start=${dto.startDate} end=${dto.endDate}`,
    );

    // If passed time period is within today + 16 days
    // Fetching the forecast for the period
    const today = moment().startOf('day');
    const lastForecastDay = today.add(16, 'days');
    const startDate = moment(dto.startDate);
    const endDate = moment(dto.endDate);
    
    if (!startDate.isBefore(today) && !endDate.isAfter(lastForecastDay)) {
      // Getting the forecast for 16 days
      // And filtering by startDate and endDate
      const { data: forecasts } = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${dto.lat}&longitude=${dto.lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,weather_code&timezone=auto&forecast_days=16`);
      
    }



    // Else fetching weather history data for past 3 years
    // And calculating the historical average


    return {
      lat: dto.lat,
      lon: dto.lon,
      startDate: dto.startDate,
      endDate: dto.endDate,
      forecasts: [],
    };
  }
}

export default ForecastService;
