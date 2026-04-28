export interface OpenMeteoForecastDailyUnits {
  time: string;
  temperature_2m_max: string;
  temperature_2m_min: string;
  precipitation_sum: string;
  precipitation_probability_max: string;
  wind_speed_10m_max: string;
  weather_code: string;
}

export interface OpenMeteoForecastDaily {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_sum: number[];
  precipitation_probability_max: number[];
  wind_speed_10m_max: number[];
  weather_code: number[];
}

export interface ForecastResponse {
  time: string;
  temperature_2m_max: number;
  temperature_2m_min: number;
  precipitation_sum: number;
  precipitation_probability_max: number;
  wind_speed_10m_max: number;
}

export interface OpenMeteoForecastResponse {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  daily_units: OpenMeteoForecastDailyUnits;
  daily: OpenMeteoForecastDaily;
}

export type ForecastMode = 'forecast' | 'archive';

export type ForecastResult = {
  mode: ForecastMode;
  units: OpenMeteoForecastDailyUnits | null;
  forecasts: ForecastResponse[];
};
