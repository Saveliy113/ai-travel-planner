/** Single session window (pre / regular / post) inside `meta.currentTradingPeriod`. */
interface YahooTradingPeriodWindow {
  timezone: string;
  start: number;
  end: number;
  gmtoffset: number;
}

interface YahooCurrentTradingPeriod {
  pre: YahooTradingPeriodWindow;
  regular: YahooTradingPeriodWindow;
  post: YahooTradingPeriodWindow;
}

/** `chart.result[].meta` from Yahoo Finance v8 chart API. */
interface YahooFinanceChartMeta {
  currency: string;
  symbol: string;
  exchangeName: string;
  fullExchangeName: string;
  instrumentType: string;
  firstTradeDate: number;
  regularMarketTime: number;
  hasPrePostMarketData: boolean;
  gmtoffset: number;
  timezone: string;
  exchangeTimezoneName: string;
  regularMarketPrice: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  regularMarketVolume: number;
  longName: string;
  shortName: string;
  chartPreviousClose: number;
  priceHint: number;
  currentTradingPeriod: YahooCurrentTradingPeriod;
  dataGranularity: string;
  range: string;
  validRanges: string[];
}

/** Yahoo often uses `null` for missing bars in parallel arrays. */
type YahooFinanceNumericBarArray = Array<number | null>;

/** One series row in `indicators.quote` (parallel arrays per bar). */
interface YahooFinanceQuoteSeries {
  close: YahooFinanceNumericBarArray;
  high: YahooFinanceNumericBarArray;
  open: YahooFinanceNumericBarArray;
  low: YahooFinanceNumericBarArray;
  volume: YahooFinanceNumericBarArray;
}

interface YahooFinanceAdjcloseSeries {
  adjclose: YahooFinanceNumericBarArray;
}

interface YahooFinanceChartIndicators {
  quote: YahooFinanceQuoteSeries[];
  adjclose: YahooFinanceAdjcloseSeries[];
}

interface YahooFinanceChartResult {
  meta: YahooFinanceChartMeta;
  timestamp: YahooFinanceNumericBarArray;
  indicators: YahooFinanceChartIndicators;
}

/** Present when `chart.error` is non-null (shape varies; extend as needed). */
interface YahooFinanceChartError {
  code?: string;
  description?: string;
}

/** Yahoo Finance v8 chart API JSON root (`/v8/finance/chart/{symbol}`). */
interface TickerFinanceChartResponse {
  chart: {
    result: YahooFinanceChartResult[] | null;
    error: YahooFinanceChartError | null;
  };
}

export type {
  TickerFinanceChartResponse,
  YahooFinanceChartResult,
  YahooFinanceChartMeta,
  YahooFinanceChartIndicators,
  YahooFinanceQuoteSeries,
  YahooFinanceAdjcloseSeries,
  YahooFinanceNumericBarArray,
  YahooCurrentTradingPeriod,
  YahooTradingPeriodWindow,
  YahooFinanceChartError,
};
