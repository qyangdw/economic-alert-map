import { NextResponse } from 'next/server'
import { getCached, setCache } from '@/lib/cache'

export const dynamic = 'force-dynamic'

const CACHE_KEY = 'fx-rates'
const CACHE_TTL = 600_000 // 10 min

export interface FxRate {
  base: string
  quote: string
  rate: number
  change24h?: number  // % change vs previous day
}

// Frankfurter API — free, no key required, ECB data
async function fetchFrankfurter(base: string, targets: string[]): Promise<Record<string, number>> {
  const url = `https://api.frankfurter.app/latest?from=${base}&to=${targets.join(',')}`
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error('Frankfurter API failed')
  const data = await res.json()
  return data.rates as Record<string, number>
}

// Get yesterday's rates for 24h change
async function fetchPreviousFrankfurter(base: string, targets: string[]): Promise<Record<string, number>> {
  // Get the most recent available date (yesterday)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  // Skip weekends (FX markets closed)
  if (yesterday.getDay() === 0) yesterday.setDate(yesterday.getDate() - 2)
  if (yesterday.getDay() === 6) yesterday.setDate(yesterday.getDate() - 1)
  const dateStr = yesterday.toISOString().split('T')[0]
  const url = `https://api.frankfurter.app/${dateStr}?from=${base}&to=${targets.join(',')}`
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return {}
    const data = await res.json()
    return data.rates as Record<string, number>
  } catch {
    return {}
  }
}

export async function GET() {
  try {
    const cached = getCached<FxRate[]>(CACHE_KEY)
    if (cached) {
      return NextResponse.json({ success: true, data: cached }, {
        headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=120' },
      })
    }

    const EUR_TARGETS = ['USD', 'GBP', 'JPY', 'CNY', 'CHF', 'AUD', 'CAD', 'KRW', 'HKD', 'SGD']
    const CNY_TARGETS = ['USD', 'EUR', 'JPY', 'KRW', 'HKD', 'SGD', 'AUD', 'CAD', 'BRL', 'INR']

    const [eurNow, eurPrev, cnyNow, cnyPrev] = await Promise.all([
      fetchFrankfurter('EUR', EUR_TARGETS).catch(() => ({} as Record<string, number>)),
      fetchPreviousFrankfurter('EUR', EUR_TARGETS),
      fetchFrankfurter('CNY', CNY_TARGETS).catch(() => ({} as Record<string, number>)),
      fetchPreviousFrankfurter('CNY', CNY_TARGETS),
    ])

    const rates: FxRate[] = []

    for (const [quote, rate] of Object.entries(eurNow)) {
      const prev = eurPrev[quote]
      rates.push({
        base: 'EUR',
        quote,
        rate: Math.round(rate * 10000) / 10000,
        change24h: prev ? Math.round(((rate - prev) / prev) * 10000) / 100 : undefined,
      })
    }

    for (const [quote, rate] of Object.entries(cnyNow)) {
      const prev = cnyPrev[quote]
      rates.push({
        base: 'CNY',
        quote,
        rate: Math.round(rate * 10000) / 10000,
        change24h: prev ? Math.round(((rate - prev) / prev) * 10000) / 100 : undefined,
      })
    }

    setCache(CACHE_KEY, rates, CACHE_TTL)
    return NextResponse.json({ success: true, data: rates }, {
      headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=120' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
