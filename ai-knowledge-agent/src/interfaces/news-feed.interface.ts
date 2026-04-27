interface NewsFeedTopic {
  topic: string;
  relevance_score: string;
}

interface NewsFeedTickerSentiment {
  ticker: string;
  relevance_score: string;
  ticker_sentiment_score: string;
  ticker_sentiment_label: string;
}

interface NewsFeedArticle {
  title: string;
  url: string;
  time_published: string;
  authors: string[];
  summary: string;
  banner_image: string;
  source: string;
  category_within_source: string;
  source_domain: string;
  topics: NewsFeedTopic[];
  overall_sentiment_score: number;
  overall_sentiment_label: string;
  ticker_sentiment: NewsFeedTickerSentiment[];
}

interface NewsFeedGetResponse {
  items: string;
  sentiment_score_definition: string;
  relevance_score_definition: string;
  feed: NewsFeedArticle[];
}

export type {
  NewsFeedTopic,
  NewsFeedTickerSentiment,
  NewsFeedArticle,
  NewsFeedGetResponse,
};
