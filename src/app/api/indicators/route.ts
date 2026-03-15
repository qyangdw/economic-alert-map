import { NextResponse } from 'next/server'
import { getCached, setCache } from '@/lib/cache'
import type { MarketIndicator } from '@/types'

export const dynamic = 'force-dynamic'

const CACHE_KEY = 'indicators'
const CACHE_TTL = 300_000

const YAHOO_SYMBOLS = [
  // Indices
  { symbol: '^GSPC', name: 'S&P 500' },
  { symbol: '^IXIC', name: 'NASDAQ' },
  { symbol: '^GDAXI', name: 'DAX' },
  { symbol: '^N225', name: 'Nikkei' },
  { symbol: '000001.SS', name: 'SSE' },
  { symbol: '^HSI', name: 'Hang Seng' },
  // Commodities
  { symbol: 'CL=F', name: 'WTI Oil' },
  { symbol: 'GC=F', name: 'Gold' },
  { symbol: 'NG=F', name: 'Nat Gas' },
  // Volatility
  { symbol: '^VIX', name: 'VIX' },
]

async function fetchQuote(symbol: string, name: string): Promise<MarketIndicator | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2d`
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })
    if (!res.ok) return null

    const json = await res.json()
    const result = json.chart?.result?.[0]
    if (!result) return null

    const closes = result.indicators?.quote?.[0]?.close ?? []
    const prev = closes[closes.length - 2] ?? closes[closes.length - 1]
    const current = closes[closes.length - 1]
    if (!current || !prev) return null

    return {
      symbol,
      name,
      price: Math.round(current * 100) / 100,
      change: Math.round((current - prev) * 100) / 100,
      changePercent: Math.round(((current - prev) / prev) * 10000) / 100,
      timestamp: new Date().toISOString(),
    }
  } catch {
    return null
  }
}

// Fetch multiple crypto prices at once from CoinGecko (free, no key)
async function fetchCrypto(): Promise<MarketIndicator[]> {
  const COINS = [
    { id: 'bitcoin', symbol: 'BTC', name: 'BTC' },
    { id: 'ethereum', symbol: 'ETH', name: 'ETH' },
    { id: 'binancecoin', symbol: 'BNB', name: 'BNB' },
    { id: 'solana', symbol: 'SOL', name: 'SOL' },
    { id: 'tether', symbol: 'USDT', name: 'USDT' },
    { id: 'ripple', symbol: 'XRP', name: 'XRP' },
  ]

  // Try Binance first for BTC/ETH/BNB/SOL
  try {
    const binanceSymbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT']
    const res = await fetch(
      `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(binanceSymbols))}`,
      { signal: AbortSignal.timeout(4000) },
    )
    if (res.ok) {
      const data = await res.json() as Array<{
        symbol: string; lastPrice: string; priceChange: string; priceChangePercent: string; closeTime: number
      }>
      const results: MarketIndicator[] = data.map(d => {
        const nameMap: Record<string, string> = {
          BTCUSDT: 'BTC', ETHUSDT: 'ETH', BNBUSDT: 'BNB', SOLUSDT: 'SOL', XRPUSDT: 'XRP',
        }
        return {
          symbol: d.symbol,
          name: nameMap[d.symbol] ?? d.symbol,
          price: Math.round(parseFloat(d.lastPrice) * 100) / 100,
          change: Math.round(parseFloat(d.priceChange) * 100) / 100,
          changePercent: Math.round(parseFloat(d.priceChangePercent) * 100) / 100,
          timestamp: new Date(d.closeTime).toISOString(),
        }
      })
      // Add USDT separately (always ~1.00)
      results.push({ symbol: 'USDT', name: 'USDT', price: 1.00, change: 0, changePercent: 0, timestamp: new Date().toISOString() })
      return results
    }
  } catch { /* fall through to CoinGecko */ }

  // CoinGecko fallback
  try {
    const ids = COINS.map(c => c.id).join(',')
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
      { signal: AbortSignal.timeout(6000) },
    )
    if (!res.ok) return []
    const data = await res.json()
    return COINS.map(({ id, symbol, name }) => {
      const coin = data[id]
      if (!coin) return null
      const price = coin.usd ?? 0
      const changePct = coin.usd_24h_change ?? 0
      return {
        symbol,
        name,
        price: Math.round(price * 100) / 100,
        change: Math.round((price * changePct / 100) * 100) / 100,
        changePercent: Math.round(changePct * 100) / 100,
        timestamp: new Date().toISOString(),
      }
    }).filter((v): v is MarketIndicator => v !== null)
  } catch {
    return []
  }
}

export async function GET() {
  try {
    const cached = getCached<MarketIndicator[]>(CACHE_KEY)
    if (cached) {
      return NextResponse.json({ success: true, data: cached }, {
        headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' },
      })
    }

    const [cryptoList, ...quoteResults] = await Promise.all([
      fetchCrypto(),
      ...YAHOO_SYMBOLS.map(s => fetchQuote(s.symbol, s.name)),
    ])

    const stockIndicators = quoteResults
      .filter((v): v is MarketIndicator => v !== null)

    const indicators: MarketIndicator[] = [...stockIndicators, ...cryptoList]

    setCache(CACHE_KEY, indicators, CACHE_TTL)
    return NextResponse.json({ success: true, data: indicators }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
