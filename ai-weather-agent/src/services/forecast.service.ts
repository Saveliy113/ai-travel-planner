import axios from 'axios';
import { plainToInstance } from 'class-transformer';
import moment from 'moment';

import { ForecastQueryDto } from '../dtos/forecast.dto';
import type { ForecastMode, ForecastResponse, ForecastResult, OpenMeteoForecastResponse } from '../interfaces/open-meteo-forecast.interface';

import { logger } from '../utils/logger';

class ForecastService {
  private getForecastsData = async (mode: ForecastMode, dto: ForecastQueryDto): Promise<ForecastResult> => {
    try {
      const { data: forecasts } = await axios.get<OpenMeteoForecastResponse>(`${mode === 'forecast' ? process.env.OPEN_METEO_API_URL_FORECAST : process.env.OPEN_METEO_API_URL_ARCHIVE}/${mode}`, {
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
        units: forecasts.daily_units,
        forecasts: forecasts.daily.time.map((time, index) => ({
          time,
          temperature_2m_max: forecasts.daily.temperature_2m_max[index],
          temperature_2m_min: forecasts.daily.temperature_2m_min[index],
          precipitation_sum: forecasts.daily.precipitation_sum[index],
          precipitation_probability_max: forecasts.daily.precipitation_probability_max[index],
          wind_speed_10m_max: forecasts.daily.wind_speed_10m_max[index],
        })),
      });
    } catch (error) {
      logger.error(
        `[ForecastService] getForecastsData: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  private calculateAverageWeather(forecasts: ForecastResponse[], startDate: string, endDate: string): ForecastResponse[] {
    try {
      const byMonthDay = new Map<string, ForecastResponse[]>();

      for (const row of forecasts) {
        const md = moment(row.time, 'YYYY-MM-DD').format('MM-DD');
        const bucket = byMonthDay.get(md) || [];
        bucket.push(row);
        byMonthDay.set(md, bucket);
      }

      const result: ForecastResponse[] = [];
      const start = moment(startDate, 'YYYY-MM-DD');
      const end = moment(endDate, 'YYYY-MM-DD');

      for (let day = start.clone(); day.isSameOrBefore(end, 'day'); day.add(1, 'day')) {
        const mdKey = day.format('MM-DD');
        const group = byMonthDay.get(mdKey);

        if (!group?.length) {
          continue;
        }

        const n = group.length;
        const mean = (pick: (row: ForecastResponse) => number) => Math.round((group.reduce((sum, row) => sum + pick(row), 0) / n) * 100) / 100;

        result.push({
          time: day.format('YYYY-MM-DD'),
          temperature_2m_max: mean((row) => row.temperature_2m_max),
          temperature_2m_min: mean((row) => row.temperature_2m_min),
          precipitation_sum: mean((row) => row.precipitation_sum),
          precipitation_probability_max: mean((row) => row.precipitation_probability_max),
          wind_speed_10m_max: mean((row) => row.wind_speed_10m_max),
        });
      }

      return result;
    } catch (error) {
      logger.error(
        `[ForecastService] calculateAverageWeather: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }
  
  public async getForecasts(query: Record<string, unknown>): Promise<ForecastResult> {
    try {
      const dto = plainToInstance(ForecastQueryDto, query);
      logger.debug(
        `[ForecastService] getForecasts: Getting forecasts for location lat=${dto.lat} lon=${dto.lon}`,
      );
  
      let response: ForecastResult | null = null;
      let mode: ForecastMode = 'forecast';
      
      // If passed time period is within today + 16 days
      // Fetching the forecast for the period
      const today = moment().startOf('day');
      logger.info(`[ForecastService] getForecasts: Current date=${today.format('YYYY-MM-DD')}`);
  
      const startDate = moment(dto.startDate);
      const endDate = moment(dto.endDate);
      logger.info(`[ForecastService] getForecasts: Target period: from ${startDate.format('YYYY-MM-DD')} to ${endDate.format('YYYY-MM-DD')}`);

      if (startDate.isSameOrAfter(today, 'day') && endDate.isSameOrBefore(today.clone().add(16, 'days'), 'day')) {
        mode = 'forecast';
        logger.info(`[ForecastService] getForecasts: Target period is within forecast window, mode=forecast`);

        // Getting the forecast for 16 days
        response = await this.getForecastsData(mode, dto);
        response.forecasts = response.forecasts.filter(forecast => moment(forecast.time).isSameOrAfter(startDate, 'day') && moment(forecast.time).isSameOrBefore(endDate, 'day'));
      } else {
        mode = 'archive';
        logger.info(`[ForecastService] getForecasts: Target period is outside forecast window, mode=archive`);

        // Else fetching weather history data for past 3 years
        // And calculating the historical average
        logger.info(`[ForecastService] getForecasts: Fetching weather history data for past 3 years`);
        let currentYear = moment().year();
        const currentMonth = moment().month();
        const endDateMonth = moment(endDate).month();
        logger.info(`[ForecastService] getForecasts: Current year=${currentYear}, current month=${currentMonth}, endDate month=${endDateMonth}`);
  
        // If current month is before endDate month,
        // then the year is the previous year
        if (currentMonth < endDateMonth) {
          logger.info(`[ForecastService] getForecasts: Current month is before endDate month, decrementing year`);
          currentYear--;
        }
        logger.info(`[ForecastService] getForecasts: Fetching weather history data for years: ${currentYear} to ${currentYear - 3}`);
        for (let year = currentYear; year > currentYear - 3; year--) {
          const start = moment(startDate).year(year).format('YYYY-MM-DD');
          const end = moment(endDate).year(year).format('YYYY-MM-DD');
          const weatherHistory = await this.getForecastsData(mode, { ...dto, startDate: start, endDate: end });
  
          const newResponse: ForecastResult = {
            mode,
            units: weatherHistory.units,
            forecasts: [...(response?.forecasts || []), ...weatherHistory.forecasts],
          };
          response = newResponse;
        }
      }

      if (!response) {
        throw new Error('No data found');
      }

      // Calculating average weather for each day
      // If mode is archive
      if (mode === 'archive') {
        logger.info(`[ForecastService] getForecasts: mode=archive, calculating average weather for each day`);
        response.forecasts = this.calculateAverageWeather(response.forecasts, dto.startDate, dto.endDate);
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
