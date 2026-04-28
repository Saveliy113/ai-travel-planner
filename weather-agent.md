Weather Agent — Development Requirements

1. Purpose

Weather Agent отвечает за получение погодных данных и преобразование их в понятные ограничения для планировщика маршрута.

Он НЕ строит itinerary и НЕ выбирает POI.

Его задача:

location + trip date/month → weather data → weather constraints for itinerary

⸻

2. Responsibilities

Weather Agent должен:

* принимать координаты направления или района
* получать прогноз погоды через external weather API
* поддерживать прогноз по конкретным датам
* поддерживать исторические/климатические данные для месяцев, если точных дат нет
* возвращать нормализованный weather context
* формировать погодные ограничения для Itinerary Agent
* логировать все provider calls
* возвращать partial/fallback результат при ошибках API

Weather Agent НЕ должен:

* строить маршрут
* выбирать конкретные места
* выдумывать погоду
* хардкодить сезонность вручную
* принимать решения вместо Itinerary Agent

⸻

3. Recommended API Provider

Primary Provider: Open-Meteo

Open-Meteo подходит для MVP, потому что:

* не требует API key
* поддерживает forecast API
* поддерживает historical weather API
* поддерживает climate / historical averages через archive endpoints
* удобно использовать с координатами
* снижает зависимость от платных сервисов

Optional Provider: OpenWeather

OpenWeather можно добавить позже как alternative provider.

Использовать только если нужны:

* более привычные weather conditions
* commercial-grade API
* дополнительные weather alerts

⸻

4. Weather Modes

Weather Agent должен поддерживать два режима.

4.1 Forecast Mode

Используется, если пользователь указал конкретную дату поездки и она попадает в доступный forecast window.

Пример:

Plan 5 days in Phuket from 2026-05-10

Agent должен получить daily forecast на даты поездки.

4.2 Climate Mode

Используется, если пользователь указал только месяц или сезон, без точных дат.

Пример:

Plan 5 days in Phuket in May

Agent должен получить исторические погодные данные или climate averages через API, а не использовать ручной hardcode.

Цель climate mode:

* оценить типичную температуру
* оценить вероятность осадков
* определить общий rain risk
* дать planner’у ограничения для outdoor/indoor активностей

⸻

5. Input Contract

type WeatherAgentInput = {
  destination: string
  lat: number
  lon: number
  days: number
  startDate?: string
  month?: string
  year?: number
  lang?: 'en' | 'ru'
}

Field Rules

Field	Required	Description
destination	yes	Human-readable destination name
lat	yes	Latitude from Location Agent
lon	yes	Longitude from Location Agent
days	yes	Trip duration, 1–7 days
startDate	optional	Exact start date, format YYYY-MM-DD
month	optional	Month name or number if exact date is unknown
year	optional	Year for trip, if known
lang	optional	Output language

Validation Rules

* days must be between 1 and 7
* lat must be valid latitude
* lon must be valid longitude
* either startDate or month should be provided
* if neither is provided, Weather Agent should return neutral weather context with warning

⸻

6. Output Contract

type WeatherAgentOutput = {
  location: WeatherLocation
  mode: 'forecast' | 'climate' | 'unavailable'
  summary: string
  daily: WeatherDay[]
  constraints: WeatherConstraints
  warnings: string[]
  providerMeta: WeatherProviderMeta[]
}

WeatherLocation

type WeatherLocation = {
  destination: string
  lat: number
  lon: number
  timezone?: string
}

WeatherDay

type WeatherDay = {
  date?: string
  label?: string
  tempMinC?: number
  tempMaxC?: number
  avgTempC?: number
  precipitationMm?: number
  precipitationProbability?: number
  windSpeedMaxKmh?: number
  weatherCode?: number
  recommendation: 'outdoor_ok' | 'indoor_preferred' | 'mixed' | 'unknown'
}

WeatherConstraints

type WeatherConstraints = {
  rainRiskLevel: 'low' | 'medium' | 'high' | 'unknown'
  heatRiskLevel: 'low' | 'medium' | 'high' | 'unknown'
  windRiskLevel: 'low' | 'medium' | 'high' | 'unknown'
  indoorRecommended: boolean
  planFlexibleOutdoorActivities: boolean
  avoidBoatTrips: boolean
  preferMorningOutdoorActivities: boolean
}

WeatherProviderMeta

type WeatherProviderMeta = {
  provider: 'open_meteo' | 'open_weather'
  operation: 'forecast' | 'historical' | 'climate'
  status: 'success' | 'error' | 'partial'
  latencyMs: number
  error?: string
}

⸻

7. Open-Meteo Forecast Request

Use forecast endpoint when startDate is available and supported by forecast window.

Example request:

GET https://api.open-meteo.com/v1/forecast
  ?latitude=7.8804
  &longitude=98.3923
  &daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,weather_code
  &timezone=auto
  &forecast_days=7

Required daily fields:

temperature_2m_max
temperature_2m_min
precipitation_sum
precipitation_probability_max
wind_speed_10m_max
weather_code

⸻

8. Climate / Historical Mode

If user provides only month, use historical weather data instead of hardcoded rules.

Example:

Plan 5 days in Phuket in May

Weather Agent should:

1. Convert month to historical date range
2. Fetch historical daily weather data for previous years
3. Calculate averages
4. Derive weather constraints

Suggested Historical Range

For MVP:

last 3–5 years for the requested month

Example for May:

2021-05-01 → 2021-05-31
2022-05-01 → 2022-05-31
2023-05-01 → 2023-05-31
2024-05-01 → 2024-05-31
2025-05-01 → 2025-05-31

Historical Metrics to Calculate

type ClimateSummary = {
  avgTempMaxC: number
  avgTempMinC: number
  avgPrecipitationMmPerDay: number
  rainyDaysRatio: number
  avgWindSpeedKmh?: number
}

Climate Mode Output

In climate mode, daily does not represent exact forecast days.

Instead, it can contain synthetic labels:

[
  {
    "label": "Typical day in May",
    "avgTempC": 29,
    "precipitationMm": 7.2,
    "recommendation": "mixed"
  }
]

Important:

* Do not present climate data as exact forecast
* Clearly mark it as historical average
* Add warning that real weather may differ

⸻

9. Constraint Derivation Rules

Weather Agent should convert raw weather values into itinerary-friendly constraints.

Rain Risk

low    → precipitation probability < 30% OR low historical rainy day ratio
medium → 30–60%
high   → > 60%

Heat Risk

low    → max temperature < 30°C
medium → 30–34°C
high   → >= 35°C

Wind Risk

low    → wind speed < 25 km/h
medium → 25–40 km/h
high   → > 40 km/h

Recommendation Rules

outdoor_ok:
  rain risk low AND heat risk low/medium
mixed:
  rain risk medium OR heat risk medium
indoor_preferred:
  rain risk high OR heat risk high OR wind risk high

Derived Flags

indoorRecommended = rainRiskLevel == high OR heatRiskLevel == high
planFlexibleOutdoorActivities = rainRiskLevel in [medium, high]
avoidBoatTrips = windRiskLevel == high OR rainRiskLevel == high
preferMorningOutdoorActivities = heatRiskLevel in [medium, high]

⸻

10. Usage by Itinerary Agent

Weather Agent output should influence itinerary planning.

Examples:

High rain risk

Itinerary Agent should:

* add indoor alternatives
* avoid full-day outdoor plans
* keep beach activities flexible
* prefer cafes, malls, museums, restaurants as backups

High heat risk

Itinerary Agent should:

* place outdoor activities in the morning
* avoid long walking routes at midday
* suggest rest/cafe time in afternoon

High wind risk

Itinerary Agent should:

* avoid boat trips
* avoid island hopping suggestions
* prefer land-based activities

⸻

11. Caching Requirements

Cache weather API responses to reduce latency and external calls.

Cache Keys

weather:forecast:{lat}:{lon}:{startDate}:{days}
weather:climate:{lat}:{lon}:{month}:{yearsRange}

Recommended TTL

Data	TTL
Forecast	1–3 hours
Historical / climate summary	30–90 days
Failed provider response	5–15 minutes

Cache can be stored in PostgreSQL for MVP.

⸻

12. Error Handling

Weather Agent should handle:

* provider timeout
* unavailable forecast
* invalid coordinates
* unsupported date range
* malformed response
* empty historical data

Fallbacks

Error	Fallback
Forecast unavailable	Try climate mode
Historical unavailable	Return unavailable mode with warning
Provider timeout	Return cached response if available
Partial daily data	Return partial result and warning

⸻

13. Observability

Every provider call should be logged.

Fields:

type WeatherCallLog = {
  requestId: string
  provider: 'open_meteo' | 'open_weather'
  operation: 'forecast' | 'historical' | 'climate'
  input: object
  status: 'success' | 'error' | 'partial'
  latencyMs: number
  error?: string
  createdAt: string
}

Store logs in:

agent_runs

or in separate table:

provider_call_logs

⸻

14. Security Requirements

* validate coordinates
* validate date ranges
* limit days to 7
* do not expose provider internals to frontend
* sanitize provider responses before passing to LLM
* rate limit weather endpoint

If provider requires API key in the future, keep it only on backend.

⸻

15. Performance Requirements

Target for MVP:

Metric	Target
Forecast API latency	< 2s
Climate calculation	< 4s with cache
Full Weather Agent response	< 5s
Forecast cache hit	preferred
Historical cache hit	strongly preferred

⸻

16. Example Forecast Input

{
  "destination": "Phuket",
  "lat": 7.8804,
  "lon": 98.3923,
  "startDate": "2026-05-10",
  "days": 5,
  "lang": "en"
}

⸻

17. Example Forecast Output

{
  "location": {
    "destination": "Phuket",
    "lat": 7.8804,
    "lon": 98.3923,
    "timezone": "Asia/Bangkok"
  },
  "mode": "forecast",
  "summary": "The forecast indicates mixed weather with possible rain. Outdoor activities should stay flexible.",
  "daily": [
    {
      "date": "2026-05-10",
      "tempMinC": 26,
      "tempMaxC": 31,
      "precipitationMm": 4.5,
      "precipitationProbability": 55,
      "windSpeedMaxKmh": 18,
      "weatherCode": 61,
      "recommendation": "mixed"
    }
  ],
  "constraints": {
    "rainRiskLevel": "medium",
    "heatRiskLevel": "medium",
    "windRiskLevel": "low",
    "indoorRecommended": false,
    "planFlexibleOutdoorActivities": true,
    "avoidBoatTrips": false,
    "preferMorningOutdoorActivities": true
  },
  "warnings": [],
  "providerMeta": [
    {
      "provider": "open_meteo",
      "operation": "forecast",
      "status": "success",
      "latencyMs": 730
    }
  ]
}

⸻

18. Example Climate Input

{
  "destination": "Phuket",
  "lat": 7.8804,
  "lon": 98.3923,
  "month": "May",
  "days": 5,
  "lang": "en"
}

⸻

19. Example Climate Output

{
  "location": {
    "destination": "Phuket",
    "lat": 7.8804,
    "lon": 98.3923
  },
  "mode": "climate",
  "summary": "Historical weather data for May suggests warm weather with elevated rain risk. Outdoor activities should be planned flexibly.",
  "daily": [
    {
      "label": "Typical day in May",
      "avgTempC": 29,
      "precipitationMm": 7.2,
      "recommendation": "mixed"
    }
  ],
  "constraints": {
    "rainRiskLevel": "high",
    "heatRiskLevel": "medium",
    "windRiskLevel": "low",
    "indoorRecommended": true,
    "planFlexibleOutdoorActivities": true,
    "avoidBoatTrips": true,
    "preferMorningOutdoorActivities": true
  },
  "warnings": [
    "Climate mode uses historical averages, not exact forecast. Real weather may differ."
  ],
  "providerMeta": [
    {
      "provider": "open_meteo",
      "operation": "climate",
      "status": "success",
      "latencyMs": 1600
    }
  ]
}

⸻

20. Acceptance Criteria

Weather Agent is ready when:

* it accepts normalized location input
* it supports forecast mode for exact dates
* it supports climate mode for month-only requests
* it does not hardcode seasonality
* it derives itinerary-friendly constraints
* it returns structured JSON
* it logs provider calls
* it uses caching
* it handles provider failures gracefully
* it clearly marks historical data as non-forecast

⸻

21. MVP Implementation Order

1. Implement input validation
2. Implement Open-Meteo forecast request
3. Normalize forecast response
4. Add weather constraint derivation
5. Implement climate mode using historical API data
6. Add caching
7. Add provider call logging
8. Add fallback from forecast to climate
9. Add integration with Itinerary Agent