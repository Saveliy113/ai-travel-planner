import { logger } from '../utils/logger';
import { IngestSort, IngestStartBodyDto } from '../dtos/ingest.dto';
import axios from 'axios';
import { NewsFeedGetResponse, TickerFinanceChartResponse } from '../interfaces';

interface IngestStartResult {
  status: 'accepted';
  params: {
    ticker: string;
    timeFrom: string;
    sort: IngestSort;
    limit: number;
  };
}

class IngestService {
  public async start(dto: IngestStartBodyDto): Promise<IngestStartResult> {
    const ticker = dto.ticker;
    const timeFrom = `${dto.timeFrom}T0000`;
    const sort = dto.sort ?? IngestSort.LATEST;
    const limit = dto.limit ?? 50;

    logger.info(
      `[IngestService] start ingest with ticker=${ticker}, timeFrom=${timeFrom}, sort=${sort}, limit=${limit}`,
    );

    // Getting news data from AlphaVantage
    const { data: newsData } = await axios.get<NewsFeedGetResponse>(`${process.env.ALPHA_VANTAGE_API_URL}/news`, {
      params: {
        apikey: process.env.ALPHA_VANTAGE_API_KEY,
        ticker,
      },
    });
    console.log(newsData);

    // Getting finance data from Yahoo Finance
    if (newsData.feed.length > 0) {
      for (const article of newsData.feed) {
        const isoDateStart = article.time_published.replace(
          /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/,
          "$1-$2-$3T$4:$5:$6",
        );

        const dateStart = new Date(isoDateStart);
        const dateEnd = new Date(isoDateStart);
        dateEnd.setDate(dateEnd.getDate() + 10);

        const period1 = Math.floor(dateStart.getTime() / 1000);
        const period2 = Math.floor(dateEnd.getTime() / 1000);

        const { data: financeData } = await axios.get<TickerFinanceChartResponse>(
          `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`,
          {
            params: {
              interval: '1d',
              period1,
              period2,
            },
          },
        );
        console.log(financeData);

        const first = financeData.chart.result?.[0];
        const quote0 = first?.indicators.quote[0];
        const adj0 = first?.indicators.adjclose[0];
        if (!first || (!quote0 && !adj0)) {
          continue;
        }

        const closes = quote0?.close;
        const adjCloses = adj0?.adjclose;

        // Defining final prices
        const prices = adjCloses ?? closes
        const filteredPricces = prices?.filter(price => price !== null)

        const startPrice = filteredPricces[0];

      }
    }

    return {
      status: 'accepted',
      params: { ticker, timeFrom, sort, limit },
    };
  }
}

export default IngestService;


function computeOutcome(result: any) {

  const closes = result.indicators.quote[0].close;

  const adj = result.indicators.adjclose?.[0]?.adjclose;

  const prices = adj ?? closes;

  const clean = prices.filter((p: number) => p != null);

  const start = clean[0];

  const safe = (i: number) =>

    clean[i] != null ? clean[i] : clean[clean.length - 1];

  const calc = (price: number) =>

    ((price - start) / start) * 100;

  return {

    "1d": calc(safe(1)),

    "3d": calc(safe(3)),

    "7d": calc(safe(7)),

  };

}