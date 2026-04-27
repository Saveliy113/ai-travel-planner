import axios from 'axios';
import { plainToInstance } from 'class-transformer';
import moment from 'moment';

import { ForecastQueryDto } from '../dtos/forecast.dto';
import type { ForecastResponse, ForecastResult, OpenMeteoForecastDailyUnits, OpenMeteoForecastResponse } from '../interfaces/open-meteo-forecast.interface';
import { logger } from '../utils/logger';
class ForecastService {
  private getForecastsData = async (mode: 'forecast' | 'archive', dto: ForecastQueryDto): Promise<ForecastResult> => {
    try {
      const { data: forecasts } = await axios.get<OpenMeteoForecastResponse>(`${process.env.OPEN_METEO_API_URL}/${mode}`, {
        params: {
          latitude: dto.lat,
          longitude: dto.lon,
          start_date: dto.startDate,
          end_date: dto.endDate,
        },
      });
    } catch (error) {
      logger.error(
        `[ForecastService] getForecastsData: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }
  public async getForecasts(query: Record<string, unknown>): Promise<ForecastResult> {
    const dto = plainToInstance(ForecastQueryDto, query);
    logger.debug(
      `[ForecastService] getForecasts: lat=${dto.lat} lon=${dto.lon} start=${dto.startDate} end=${dto.endDate}`,
    );

    const response: ForecastResult = {
      units: null,
      forecasts: [],
    };

    // If passed time period is within today + 16 days
    // Fetching the forecast for the period
    const today = moment().startOf('day');
    const lastForecastDay = today.clone().add(16, 'days');

    const startDate = moment(dto.startDate);
    const endDate = moment(dto.endDate);
    
    if (!startDate.isSameOrAfter(today, 'day') && endDate.isSameOrBefore(lastForecastDay, 'day')) {
      // Getting the forecast for 16 days
      const { data: forecasts } = await axios.get<OpenMeteoForecastResponse>(
        `https://api.open-meteo.com/v1/forecast?latitude=${dto.lat}&longitude=${dto.lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,weather_code&timezone=auto&forecast_days=16`,
      );

      // Filtering by startDate and endDate
      response.units = forecasts.daily_units;
      forecasts.daily.time.forEach((time, index) => {
        if (moment(time).isBetween(startDate, endDate, null, '[]')) {
          response.forecasts.push({
            time,
            temperature_2m_max: forecasts.daily.temperature_2m_max[index],
            temperature_2m_min: forecasts.daily.temperature_2m_min[index],
            precipitation_sum: forecasts.daily.precipitation_sum[index],
            precipitation_probability_max: forecasts.daily.precipitation_probability_max[index],
            wind_speed_10m_max: forecasts.daily.wind_speed_10m_max[index],  
            weather_code: forecasts.daily.weather_code[index],
          });
        }
      });  
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

      for (let year = currentYear; year <= currentYear - 3; year--) {
        const { data: weatherHistory } = await axios.get<OpenMeteoForecastResponse>(
          `https://archive-api.open-meteo.com/v1/archive?latitude=${dto.lat}&longitude=${dto.lon}&start_date=${startDate.format('YYYY-MM-DD')}&end_date=${endDate.format('YYYY-MM-DD')}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&timezone=auto`,
        );

        response.units = weatherHistory.daily_units;
        weatherHistory.daily.time.forEach((time, index) => {
          response.forecasts.push({
            time,
            temperature_2m_max: weatherHistory.daily.temperature_2m_max[index],
            temperature_2m_min: weatherHistory.daily.temperature_2m_min[index],
            precipitation_sum: weatherHistory.daily.precipitation_sum[index],
            precipitation_probability_max: weatherHistory.daily.precipitation_probability_max[index],
            wind_speed_10m_max: weatherHistory.daily.wind_speed_10m_max[index],
            weather_code: weatherHistory.daily.weather_code[index],
          });
        });
      }

      calculateAverageForecasts(response);
      return response;
    }
  }
}

export default ForecastService;
