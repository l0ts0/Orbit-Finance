import { Currency } from "../types";

// Using a CORS proxy to bypass browser restrictions when calling Yahoo Finance directly
const CORS_PROXY = "https://corsproxy.io/?";
const YAHOO_BASE_URL = "https://query1.finance.yahoo.com/v8/finance/chart/";

export type MarketType = 'TW' | 'US' | 'CRYPTO';

export interface ExchangeRatesResult {
  rates: {
    TWD: number;
    USD: number;
    JPY: number;
  };
  timestamp: number;
}

export interface StockPriceResult {
  price: number;
  timestamp: number;
  currency: string;
  symbol: string;
}

export const fetchExchangeRates = async (): Promise<ExchangeRatesResult | null> => {
  try {
    // We need USD/TWD and USD/JPY to calculate everything based on TWD
    // TWD=X implies USD/TWD, JPY=X implies USD/JPY
    const symbols = ["TWD=X", "JPY=X"];
    
    // Fetch both in parallel
    const promises = symbols.map(async (symbol) => {
      const response = await fetch(`${CORS_PROXY}${encodeURIComponent(`${YAHOO_BASE_URL}${symbol}?interval=1d&range=1d`)}`);
      const data = await response.json();
      return {
        symbol,
        price: data.chart?.result?.[0]?.meta?.regularMarketPrice,
        time: data.chart?.result?.[0]?.meta?.regularMarketTime
      };
    });

    const results = await Promise.all(promises);
    
    const usdTwdData = results.find(r => r.symbol === "TWD=X");
    const usdJpyData = results.find(r => r.symbol === "JPY=X");

    if (!usdTwdData?.price || !usdJpyData?.price) {
      console.warn("Incomplete exchange rate data received");
      return null;
    }

    // Use the latest timestamp from the two
    const timestamp = Math.max(usdTwdData.time || 0, usdJpyData.time || 0) * 1000; // Convert sec to ms

    // Calculate rates relative to 1 TWD
    // 1 TWD = 1 TWD
    // 1 TWD = (1 / usdTwdData.price) USD
    // 1 TWD = (usdJpyData.price / usdTwdData.price) JPY
    
    return {
      rates: {
        TWD: 1,
        USD: 1 / usdTwdData.price,
        JPY: usdJpyData.price / usdTwdData.price
      },
      timestamp
    };

  } catch (error) {
    console.error("Failed to fetch exchange rates:", error);
    return null;
  }
};

export const fetchStockPrice = async (ticker: string, marketType: MarketType = 'TW'): Promise<StockPriceResult | null> => {
  try {
    // Normalize ticker for Yahoo Finance
    let yahooTicker = ticker.toUpperCase().trim();
    
    // Formatting logic based on Market Type
    if (marketType === 'TW') {
       // If user typed '2330' or '0050', make it '2330.TW'
       // We skip if they already typed .TW or .TWO
       if (!yahooTicker.endsWith('.TW') && !yahooTicker.endsWith('.TWO')) {
          yahooTicker = `${yahooTicker}.TW`;
       }
    } else if (marketType === 'CRYPTO') {
       // e.g. BTC -> BTC-USD, ETH -> ETH-USD
       // If user typed BTC-USD, keep it.
       if (!yahooTicker.includes('-') && !yahooTicker.endsWith('USD')) {
          yahooTicker = `${yahooTicker}-USD`;
       }
    }
    // US: Usually just the ticker (AAPL, TSLA, NVDA) is fine. 

    const response = await fetch(`${CORS_PROXY}${encodeURIComponent(`${YAHOO_BASE_URL}${yahooTicker}?interval=1d&range=1d`)}`);
    const data = await response.json();
    
    const result = data.chart?.result?.[0]?.meta;
    
    if (!result || !result.regularMarketPrice) {
      // Fallback for TW stocks: try OTC (.TWO) if .TW failed
      if (marketType === 'TW' && yahooTicker.endsWith('.TW')) {
         const otcTicker = yahooTicker.replace('.TW', '.TWO');
         console.log(`Retrying with OTC ticker: ${otcTicker}`);
         const responseOtc = await fetch(`${CORS_PROXY}${encodeURIComponent(`${YAHOO_BASE_URL}${otcTicker}?interval=1d&range=1d`)}`);
         const dataOtc = await responseOtc.json();
         const resultOtc = dataOtc.chart?.result?.[0]?.meta;
         
         if (resultOtc && resultOtc.regularMarketPrice) {
            return {
              price: resultOtc.regularMarketPrice,
              timestamp: (resultOtc.regularMarketTime || Date.now() / 1000) * 1000,
              currency: resultOtc.currency,
              symbol: resultOtc.symbol
            };
         }
      }
      return null;
    }

    return {
      price: result.regularMarketPrice,
      timestamp: (result.regularMarketTime || Date.now() / 1000) * 1000, // Convert to ms
      currency: result.currency,
      symbol: result.symbol
    };

  } catch (error) {
    console.error(`Failed to fetch price for ${ticker}:`, error);
    return null;
  }
};