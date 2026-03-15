import { XMLParser } from 'fast-xml-parser'
import type { DataSource, FetchOptions, CrisisEvent, EventCategory } from '@/types'
import { geocode } from '@/lib/geocoder'
import { scoreThreatLevel } from '@/lib/scorer'

interface RssFeed {
  name: string
  url: string
  sourceLabel: string
  focusEconomic?: boolean
}

const FEEDS: RssFeed[] = [
  // General world news
  { name: 'reuters-world', url: 'https://feeds.reuters.com/Reuters/worldNews', sourceLabel: 'Reuters' },
  { name: 'ap', url: 'https://rsshub.app/apnews/topics/world-news', sourceLabel: 'AP News' },
  { name: 'bbc', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', sourceLabel: 'BBC News' },
  { name: 'nhk', url: 'https://www3.nhk.or.jp/rss/news/cat6.xml', sourceLabel: 'NHK World' },
  { name: 'aljazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', sourceLabel: 'Al Jazeera' },
  // Economic & trade news
  { name: 'reuters-biz', url: 'https://feeds.reuters.com/reuters/businessNews', sourceLabel: 'Reuters Business', focusEconomic: true },
  { name: 'cnbc-economy', url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=20910258', sourceLabel: 'CNBC Economy', focusEconomic: true },
  { name: 'wto', url: 'https://www.wto.org/english/news_e/news_e.rss', sourceLabel: 'WTO News', focusEconomic: true },
  { name: 'ft', url: 'https://www.ft.com/rss/home', sourceLabel: 'Financial Times', focusEconomic: true },
  { name: 'bloomberg', url: 'https://feeds.bloomberg.com/markets/news.rss', sourceLabel: 'Bloomberg', focusEconomic: true },
]

// Keywords for general geopolitical events
const GEO_KEYWORDS = [
  'crisis', 'conflict', 'military', 'attack', 'strike',
  'war', 'nuclear', 'sanctions', 'missile', 'troops',
  'bombing', 'invasion', 'casualties', 'killed', 'weapon',
  'airstrike', 'explosion', 'terror', 'hostage', 'coup',
  'blockade', 'escalation', 'martial',
]

// Additional economic/trade keywords
const ECON_KEYWORDS = [
  'tariff', 'tariffs', 'trade war', 'trade barrier', 'trade dispute',
  'import duty', 'export ban', 'sanctions', 'embargo', 'trade deficit',
  'inflation', 'cpi', 'recession', 'gdp', 'currency', 'devaluation',
  'supply chain', 'retaliatory', 'anti-dumping', 'wto', 'trade deal',
  'free trade', 'quota', 'protectionism', 'bilateral trade',
  'market crash', 'financial crisis', 'debt default', 'interest rate',
]

const GEO_PATTERN = new RegExp([...GEO_KEYWORDS, ...ECON_KEYWORDS].join('|'), 'i')
const ECON_PATTERN = new RegExp(ECON_KEYWORDS.join('|'), 'i')

interface RssItem {
  title?: string
  description?: string
  link?: string
  pubDate?: string
  'dc:date'?: string
  guid?: string | { '#text': string }
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
})

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

function detectCategory(title: string, description: string): EventCategory {
  const text = `${title} ${description}`.toLowerCase()
  const patterns: [RegExp, EventCategory][] = [
    // Economic patterns (prioritized first for economic-focused feeds)
    [/tariff|tariffs|import\s+duty|customs\s+duty|countervailing|anti.?dumping/i, 'tariff'],
    [/trade\s+war|trade\s+dispute|trade\s+barrier|wto\s+ruling|protectionism|trade\s+deal|bilateral\s+trade/i, 'trade'],
    [/sanction|embargo|export\s+ban|retaliatory|economic\s+war/i, 'economic'],
    [/inflation|cpi|recession|gdp\s+fall|market\s+crash|financial\s+crisis|debt\s+default/i, 'economic'],
    // Geopolitical
    [/nuclear|missile|troops|military|army|navy|pentagon|defense/i, 'military'],
    [/attack|war|combat|battle|fighting|clash|killed|casualties/i, 'conflict'],
    [/terror|isis|al.?qaeda|bomb|explosion|hostage/i, 'terrorism'],
    [/earthquake|tsunami|hurricane|flood|volcano|wildfire/i, 'disaster'],
    [/diplomat|embassy|treaty|summit|negotiate|un\s|united\snations/i, 'diplomatic'],
    [/economy|market|supply\s+chain|trade\s+tension|currency|interest\s+rate/i, 'economic'],
    [/statement|says|warns|announces|declares|condemns|urges/i, 'statement'],
  ]
  for (const [pattern, category] of patterns) {
    if (pattern.test(text)) return category
  }
  return 'statement'
}

function parseDate(item: RssItem): string {
  const raw = item.pubDate ?? item['dc:date']
  if (!raw) return new Date().toISOString()
  const d = new Date(raw)
  if (isNaN(d.getTime())) return new Date().toISOString()
  return d.toISOString()
}

function extractLink(item: RssItem): string | undefined {
  if (typeof item.link === 'string') return item.link
  return undefined
}

function extractGuid(item: RssItem): string {
  if (!item.guid) return item.link ?? item.title ?? ''
  if (typeof item.guid === 'string') return item.guid
  return item.guid['#text'] ?? ''
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

function mapItem(item: RssItem, feed: RssFeed): CrisisEvent | null {
  const title = item.title ?? ''
  const description = stripHtml(item.description ?? '')
  const combined = `${title} ${description}`

  // Economic feeds: accept economic keywords (less strict filter)
  // General feeds: require general geo-political keywords
  const passes = feed.focusEconomic
    ? ECON_PATTERN.test(combined) || GEO_PATTERN.test(combined)
    : GEO_PATTERN.test(combined)

  if (!passes) return null

  const category = detectCategory(title, description)
  const level = scoreThreatLevel(title, description, category)
  const location = geocode(combined)
  const url = extractLink(item)
  const guid = extractGuid(item)

  return {
    id: `rss:${feed.name}:${hashString(guid)}`,
    title,
    summary: description || title,
    category,
    level,
    location,
    timestamp: parseDate(item),
    source: feed.sourceLabel,
    sourceTier: 'public',
    url,
  }
}

async function fetchFeed(feed: RssFeed): Promise<CrisisEvent[]> {
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
    const event = mapItem(item, feed)
    if (event) events.push(event)
  }
  return events
}

export const rssSource: DataSource = {
  id: 'rss',
  name: 'RSS Aggregator',
  tier: 'public',

  async fetch(options?: FetchOptions): Promise<CrisisEvent[]> {
    const limit = options?.limit ?? 150
    const results = await Promise.allSettled(FEEDS.map(fetchFeed))
    const events: CrisisEvent[] = []
    for (const result of results) {
      if (result.status === 'fulfilled') {
        events.push(...result.value)
      }
    }
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    return events.slice(0, limit)
  },

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(FEEDS[0].url, {
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
