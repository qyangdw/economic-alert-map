import { XMLParser } from 'fast-xml-parser'
import type { DataSource, FetchOptions, CrisisEvent, EventCategory } from '@/types'
import { geocode } from '@/lib/geocoder'
import { scoreThreatLevel } from '@/lib/scorer'

// Official trade/tariff news RSS feeds — all free, no API key required
const TRADE_FEEDS = [
  {
    name: 'ustr',
    url: 'https://ustr.gov/rss.xml',
    sourceLabel: 'USTR',
  },
  {
    name: 'wto-disputes',
    url: 'https://www.wto.org/english/tratop_e/dispu_e/dispu_e.rss',
    sourceLabel: 'WTO Disputes',
  },
  {
    name: 'commerce-itc',
    url: 'https://www.usitc.gov/press_room/news_release.xml',
    sourceLabel: 'US ITC',
  },
  {
    name: 'ec-trade',
    url: 'https://ec.europa.eu/trade/policy/news/rss_en.xml',
    sourceLabel: 'EU Trade',
  },
]

const TARIFF_PATTERN = /tariff|tariffs|trade\s+war|trade\s+barrier|import\s+duty|export\s+ban|retaliatory|anti.?dumping|countervailing|quota|embargo|trade\s+dispute|wto\s+ruling|protectionism|customs\s+duty|section\s+232|section\s+301|section\s+201/i
const TRADE_PATTERN = /trade\s+deal|free\s+trade|bilateral\s+trade|fta|trade\s+agreement|trade\s+negotiation|trade\s+deficit|supply\s+chain|trade\s+tension|trade\s+friction/i

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })

function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash).toString(36)
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}

interface RssItem {
  title?: string
  description?: string
  summary?: string
  content?: string
  link?: string
  pubDate?: string
  published?: string
  'dc:date'?: string
  guid?: string | { '#text': string }
}

function normalizeItems(parsed: unknown): RssItem[] {
  const root = parsed as Record<string, unknown>
  const channel =
    (root?.rss as Record<string, unknown>)?.channel ??
    (root?.feed as Record<string, unknown>)
  if (!channel) return []
  const items = (channel as Record<string, unknown>).item
    ?? (channel as Record<string, unknown>).entry
  if (!items) return []
  return Array.isArray(items) ? items : [items]
}

function classifyTradeEvent(title: string, desc: string): EventCategory {
  const text = `${title} ${desc}`.toLowerCase()
  if (TARIFF_PATTERN.test(text)) return 'tariff'
  if (TRADE_PATTERN.test(text)) return 'trade'
  return 'economic'
}

function parseDate(item: RssItem): string {
  const raw = item.pubDate ?? item.published ?? item['dc:date']
  if (!raw) return new Date().toISOString()
  const d = new Date(raw)
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
}

async function fetchTradeFeed(feed: typeof TRADE_FEEDS[0]): Promise<CrisisEvent[]> {
  try {
    const res = await fetch(feed.url, {
      headers: { 'User-Agent': 'EconomicAlertMap/1.0' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []
    const xml = await res.text()
    const parsed = parser.parse(xml)
    const items = normalizeItems(parsed)
    const events: CrisisEvent[] = []

    for (const item of items) {
      const title = item.title ?? ''
      const description = stripHtml(item.description ?? item.summary ?? '')
      const combined = `${title} ${description}`

      // Accept anything from official trade sources, filter loosely
      if (!TARIFF_PATTERN.test(combined) && !TRADE_PATTERN.test(combined)) continue

      const category = classifyTradeEvent(title, description)
      const level = scoreThreatLevel(title, description, category)
      const location = geocode(combined)
      const url = typeof item.link === 'string' ? item.link : undefined
      const guid = item.guid
        ? (typeof item.guid === 'string' ? item.guid : (item.guid['#text'] ?? ''))
        : (url ?? title)

      events.push({
        id: `trade:${feed.name}:${hashString(guid)}`,
        title,
        summary: description || title,
        category,
        level,
        location,
        timestamp: parseDate(item),
        source: feed.sourceLabel,
        sourceTier: 'public',
        url,
      })
    }
    return events
  } catch {
    return []
  }
}

export const tradeSource: DataSource = {
  id: 'trade',
  name: 'Trade & Tariff Monitor',
  tier: 'public',

  async fetch(options?: FetchOptions): Promise<CrisisEvent[]> {
    const limit = options?.limit ?? 80
    const results = await Promise.allSettled(TRADE_FEEDS.map(fetchTradeFeed))
    const events: CrisisEvent[] = []
    for (const result of results) {
      if (result.status === 'fulfilled') events.push(...result.value)
    }
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    return events.slice(0, limit)
  },

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(TRADE_FEEDS[0].url, {
        method: 'HEAD',
        headers: { 'User-Agent': 'EconomicAlertMap/1.0' },
        signal: AbortSignal.timeout(5000),
      })
      return res.ok
    } catch {
      return false
    }
  },
}
