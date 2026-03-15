import type { CrisisEvent, ActorStatus } from '@/types'

const KNOWN_ACTORS: Record<string, { flag: string; role: string }> = {
  // US Leadership
  'Trump': { flag: '🇺🇸', role: 'US President' },
  'Biden': { flag: '🇺🇸', role: 'US President' },
  'Bessent': { flag: '🇺🇸', role: 'US Treasury Secretary' },
  'Yellen': { flag: '🇺🇸', role: 'US Treasury Secretary' },
  'Lutnick': { flag: '🇺🇸', role: 'US Commerce Secretary' },
  'Powell': { flag: '🇺🇸', role: 'Fed Chair' },
  'USTR': { flag: '🇺🇸', role: 'US Trade Representative' },
  'Pentagon': { flag: '🇺🇸', role: 'US Dept of Defense' },
  // Multilateral / International
  'IMF': { flag: '🌐', role: 'Intl Monetary Fund' },
  'WTO': { flag: '🌐', role: 'World Trade Organization' },
  'Okonjo-Iweala': { flag: '🌐', role: 'WTO Director-General' },
  'Georgieva': { flag: '🌐', role: 'IMF Managing Director' },
  'World Bank': { flag: '🌐', role: 'World Bank' },
  'NATO': { flag: '🏳️', role: 'North Atlantic Treaty Org' },
  'Guterres': { flag: '🇺🇳', role: 'UN Secretary-General' },
  // China
  'Xi Jinping': { flag: '🇨🇳', role: 'Chinese President' },
  'Xi': { flag: '🇨🇳', role: 'Chinese President' },
  'PBOC': { flag: '🇨🇳', role: "People's Bank of China" },
  'MOFCOM': { flag: '🇨🇳', role: 'China Ministry of Commerce' },
  // Europe
  'Lagarde': { flag: '🇪🇺', role: 'ECB President' },
  'ECB': { flag: '🇪🇺', role: 'European Central Bank' },
  'von der Leyen': { flag: '🇪🇺', role: 'EU Commission President' },
  'Macron': { flag: '🇫🇷', role: 'French President' },
  'Scholz': { flag: '🇩🇪', role: 'German Chancellor' },
  // Others
  'Putin': { flag: '🇷🇺', role: 'Russian President' },
  'Zelenskyy': { flag: '🇺🇦', role: 'Ukrainian President' },
  'Netanyahu': { flag: '🇮🇱', role: 'Israeli PM' },
  'Erdogan': { flag: '🇹🇷', role: 'Turkish President' },
  'MBS': { flag: '🇸🇦', role: 'Saudi Crown Prince' },
  'OPEC': { flag: '🛢️', role: 'Oil Producing Nations' },
  'Fed': { flag: '🇺🇸', role: 'US Federal Reserve' },
  'BOJ': { flag: '🇯🇵', role: 'Bank of Japan' },
  'BOE': { flag: '🇬🇧', role: 'Bank of England' },
  // Armed groups (kept for conflict context)
  'Hezbollah': { flag: '🇱🇧', role: 'Lebanese Militia' },
  'Hamas': { flag: '🇵🇸', role: 'Palestinian Militant Group' },
  'Houthis': { flag: '🇾🇪', role: 'Yemeni Armed Group' },
  'IDF': { flag: '🇮🇱', role: 'Israel Defense Forces' },
}

export function extractActors(events: CrisisEvent[]): ActorStatus[] {
  const actorMap = new Map<string, ActorStatus>()

  for (const event of events) {
    const text = `${event.title} ${event.summary}`
    for (const [name, meta] of Object.entries(KNOWN_ACTORS)) {
      if (!text.includes(name)) continue
      const existing = actorMap.get(name)
      const isStatement = event.category === 'statement'
      if (!existing) {
        actorMap.set(name, {
          name,
          flag: meta.flag,
          role: meta.role,
          lastStatement: isStatement ? event.title : undefined,
          lastStatementTime: isStatement ? event.timestamp : undefined,
          eventCount: 1,
        })
      } else {
        actorMap.set(name, {
          ...existing,
          eventCount: existing.eventCount + 1,
          lastStatement: isStatement ? event.title : existing.lastStatement,
          lastStatementTime: isStatement ? event.timestamp : existing.lastStatementTime,
        })
      }
    }
  }

  return Array.from(actorMap.values())
    .sort((a, b) => b.eventCount - a.eventCount)
}

// Extract government responses: statements/diplomatic actions from official actors
export function extractGovResponses(events: CrisisEvent[]): {
  actor: string
  flag: string
  role: string
  responses: CrisisEvent[]
}[] {
  const govActors = Object.keys(KNOWN_ACTORS).filter(name => {
    const role = KNOWN_ACTORS[name].role.toLowerCase()
    return role.includes('president') || role.includes('minister') ||
      role.includes('secretary') || role.includes('chair') ||
      role.includes('chancellor') || role.includes('bank') ||
      role.includes('fund') || role.includes('trade') ||
      role.includes('wto') || role.includes('imf') ||
      role.includes('opec') || role.includes('ecb') ||
      role.includes('fed') || role.includes('boj') || role.includes('boe')
  })

  const responseMap = new Map<string, { flag: string; role: string; responses: CrisisEvent[] }>()

  for (const event of events) {
    if (!['statement', 'diplomatic', 'economic', 'tariff', 'trade'].includes(event.category)) continue
    const text = `${event.title} ${event.summary}`
    for (const actorName of govActors) {
      if (!text.includes(actorName)) continue
      const existing = responseMap.get(actorName)
      if (!existing) {
        responseMap.set(actorName, {
          flag: KNOWN_ACTORS[actorName].flag,
          role: KNOWN_ACTORS[actorName].role,
          responses: [event],
        })
      } else {
        if (!existing.responses.find(e => e.id === event.id)) {
          existing.responses.push(event)
        }
      }
    }
  }

  return Array.from(responseMap.entries())
    .map(([actor, data]) => ({ actor, ...data }))
    .sort((a, b) => b.responses.length - a.responses.length)
}
