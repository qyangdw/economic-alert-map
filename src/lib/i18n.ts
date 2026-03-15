export type Locale = 'en' | 'zh-TW'

export const locales: Locale[] = ['en', 'zh-TW']
export const defaultLocale: Locale = 'en'

export const localeConfig: Record<Locale, { timezone: string; dateLocale: string }> = {
  en: { timezone: 'UTC', dateLocale: 'en-US' },
  'zh-TW': { timezone: 'Asia/Taipei', dateLocale: 'zh-TW' },
}

const en = {
  meta: {
    title: 'Economic Alert Map — Real-Time Trade & Economic Intelligence',
    description: 'Live tracking of tariffs, trade wars, sanctions, and economic crises worldwide',
  },
  header: { title: '◈ Economic Alert Map', live: '⚡ Live' },
  tabs: { feed: 'Feed', timeline: 'Timeline', intel: 'Intel', response: 'Gov Response' },
  filters: { search: 'Search economic alerts...' },
  regions: {
    all: 'All', 'middle-east': 'Middle East', europe: 'Europe',
    'east-asia': 'East Asia', africa: 'Africa', americas: 'Americas',
  } as Record<string, string>,
  categories: {
    conflict: 'Conflict', military: 'Military', diplomatic: 'Diplomatic',
    economic: 'Economic', terrorism: 'Terrorism', disaster: 'Disaster',
    earthquake: 'Earthquake', statement: 'Statement', prediction: 'Prediction',
    tariff: 'Tariff', trade: 'Trade',
  } as Record<string, string>,
  levels: {
    critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low', info: 'Info',
  } as Record<string, string>,
  feed: { error: 'Failed to load alerts', empty: 'No alerts match current filters' },
  timeline: { error: 'Failed to load alerts', empty: 'No alerts to display' },
  actors: {
    loading: 'Loading actors...',
    error: 'Failed to load actors',
    empty: 'No actor data available',
    noStatements: 'No recent statements',
  },
  govResponse: {
    loading: 'Loading government responses...',
    error: 'Failed to load responses',
    empty: 'No government responses tracked yet',
    title: 'Government Responses',
    subtitle: 'Policy actions & official statements on economic crises',
  },
  markets: { loading: 'Loading markets...', error: 'Market data unavailable' },
  polymarket: { loading: 'Loading prediction markets...', error: 'Prediction markets unavailable' },
  map: {
    readArticle: 'Read article',
    cpiToggle: 'CPI Layer',
    tradeConflicts: 'Trade Conflicts',
  },
  time: { now: 'now', mAgo: '{n}m ago', hAgo: '{n}h ago', dAgo: '{n}d ago' },
}

const zhTW: typeof en = {
  meta: {
    title: '經濟警報地圖 — 即時貿易與經濟情報',
    description: '即時追蹤關稅、貿易戰、制裁與全球經濟危機',
  },
  header: { title: '◈ 經濟警報地圖', live: '⚡ 即時' },
  tabs: { feed: '動態', timeline: '時間線', intel: '情報', response: '政府回應' },
  filters: { search: '搜尋經濟警報...' },
  regions: {
    all: '全部', 'middle-east': '中東', europe: '歐洲',
    'east-asia': '東亞', africa: '非洲', americas: '美洲',
  },
  categories: {
    conflict: '衝突', military: '軍事', diplomatic: '外交',
    economic: '經濟', terrorism: '恐怖攻擊', disaster: '災害',
    earthquake: '地震', statement: '聲明', prediction: '預測',
    tariff: '關稅', trade: '貿易',
  },
  levels: {
    critical: '危急', high: '高', medium: '中', low: '低', info: '資訊',
  },
  feed: { error: '警報載入失敗', empty: '沒有符合篩選條件的警報' },
  timeline: { error: '警報載入失敗', empty: '暫無警報' },
  actors: {
    loading: '載入中...',
    error: '載入失敗',
    empty: '暫無人物資料',
    noStatements: '尚無近期發言',
  },
  govResponse: {
    loading: '載入政府回應中...',
    error: '載入回應失敗',
    empty: '尚無追蹤到政府回應',
    title: '各國政府回應',
    subtitle: '針對經濟危機的政策行動與官方聲明',
  },
  markets: { loading: '載入市場資料...', error: '市場資料無法取得' },
  polymarket: { loading: '載入預測市場...', error: '預測市場無法取得' },
  map: {
    readArticle: '閱讀全文',
    cpiToggle: 'CPI 覆蓋層',
    tradeConflicts: '貿易衝突',
  },
  time: { now: '剛剛', mAgo: '{n}分鐘前', hAgo: '{n}小時前', dAgo: '{n}天前' },
}

export type Dict = typeof en

export const dictionaries: Record<Locale, Dict> = { en, 'zh-TW': zhTW }

export function getDict(locale: Locale): Dict {
  return dictionaries[locale] ?? dictionaries.en
}
