import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Yahoo Finance API Base URL
const YAHOO_BASE_URL = "https://query1.finance.yahoo.com/v8/finance/chart/";

Deno.serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Initialize Supabase Client
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        const supabase = createClient(supabaseUrl, supabaseKey)

        // 1. Fetch Exchange Rates
        console.log("Fetching Exchange Rates...")
        const rateSymbols = ["TWD=X", "JPY=X"];
        const ratePromises = rateSymbols.map(async (symbol) => {
            const res = await fetch(`${YAHOO_BASE_URL}${symbol}?interval=1d&range=1d`);
            const data = await res.json();
            return {
                symbol,
                price: data.chart?.result?.[0]?.meta?.regularMarketPrice,
                time: data.chart?.result?.[0]?.meta?.regularMarketTime
            };
        });

        const rateResults = await Promise.all(ratePromises);
        const usdTwd = rateResults.find(r => r.symbol === "TWD=X")?.price;
        const usdJpy = rateResults.find(r => r.symbol === "JPY=X")?.price;

        if (usdTwd && usdJpy) {
            const rates = [
                { currency: 'TWD', rate: 1 },
                { currency: 'USD', rate: 1 / usdTwd },
                { currency: 'JPY', rate: usdJpy / usdTwd }
            ];

            // Update DB
            for (const r of rates) {
                const { error } = await supabase
                    .from('exchange_rates')
                    .upsert({
                        currency: r.currency,
                        rate: r.rate,
                        last_updated: new Date().toISOString()
                    });
                if (error) console.error(`Error updating ${r.currency}:`, error);
            }
            console.log("Exchange Rates Updated");
        }

        // 2. Update Stock Prices
        console.log("Fetching Stock Prices...")
        // Get all unique tickers from holdings
        const { data: holdings, error: holdingsError } = await supabase
            .from('holdings')
            .select('id, ticker, type')
            .not('ticker', 'is', null);

        if (holdingsError) throw holdingsError;

        if (holdings && holdings.length > 0) {
            // Group by ticker to avoid duplicate fetches
            const uniqueTickers = [...new Set(holdings.map(h => h.ticker).filter(t => t !== 'TWD'))];

            for (const ticker of uniqueTickers) {
                if (!ticker) continue;

                // Normalize Ticker (Simple version of service logic)
                let yahooTicker = (ticker as string).toUpperCase().trim();
                if (!yahooTicker.includes('.') && !yahooTicker.includes('-')) {
                    // Assume TW stock if 4 digits
                    if (/^\d{4}$/.test(yahooTicker)) yahooTicker += '.TW';
                }

                try {
                    const res = await fetch(`${YAHOO_BASE_URL}${yahooTicker}?interval=1d&range=1d`);
                    const data = await res.json();
                    const result = data.chart?.result?.[0]?.meta;

                    if (result && result.regularMarketPrice) {
                        const price = result.regularMarketPrice;
                        const timestamp = new Date(result.regularMarketTime * 1000).toISOString();

                        // Update all holdings with this ticker
                        const { error: updateError } = await supabase
                            .from('holdings')
                            .update({
                                price: price,
                                last_updated: timestamp
                            })
                            .eq('ticker', ticker);

                        if (updateError) console.error(`Error updating holdings for ${ticker}:`, updateError);
                        else console.log(`Updated ${ticker} to ${price}`);
                    }
                } catch (e) {
                    console.error(`Failed to fetch ${ticker}:`, e);
                }
            }
        }

        return new Response(
            JSON.stringify({ message: 'Daily update completed successfully' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error(error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
