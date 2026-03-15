import { NextResponse } from 'next/server'
import { CPI_DATA } from '@/lib/cpi-data'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Try to enrich with live data from World Bank (free, no key required)
  // Falls back to static dataset if World Bank API is unavailable
  try {
    const liveData = await fetchWorldBankCpi()
    const merged = CPI_DATA.map(point => {
      const live = liveData[point.countryCode]
      if (live !== undefined && live !== null) {
        const trend = live > point.cpi ? 'up' : live < point.cpi ? 'down' : 'stable'
        return { ...point, cpi: Math.round(live * 10) / 10, trend }
      }
      return point
    })
    return NextResponse.json(
      { success: true, data: merged, source: 'world-bank' },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300' } },
    )
  } catch {
    return NextResponse.json(
      { success: true, data: CPI_DATA, source: 'static' },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300' } },
    )
  }
}

// World Bank API — free, no key required
// https://api.worldbank.org/v2/country/all/indicator/FP.CPI.TOTL.ZG?format=json&mrv=1&per_page=100
async function fetchWorldBankCpi(): Promise<Record<string, number>> {
  const url =
    'https://api.worldbank.org/v2/country/all/indicator/FP.CPI.TOTL.ZG?format=json&mrv=1&per_page=100'
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error('World Bank API unavailable')
  const json = await res.json()
  // World Bank response: [metadata, data[]]
  const records: { countryiso3code?: string; value?: number | null }[] = json[1] ?? []
  const result: Record<string, number> = {}
  for (const r of records) {
    if (r.countryiso3code && r.value !== null && r.value !== undefined) {
      // Convert ISO3 to ISO2 for our mapping
      const iso2 = ISO3_TO_ISO2[r.countryiso3code]
      if (iso2) result[iso2] = r.value
    }
  }
  return result
}

// ISO3 → ISO2 mapping for countries in our dataset
const ISO3_TO_ISO2: Record<string, string> = {
  USA: 'US', EMU: 'EU', CHN: 'CN', JPN: 'JP', GBR: 'GB',
  DEU: 'DE', FRA: 'FR', BRA: 'BR', IND: 'IN', RUS: 'RU',
  TUR: 'TR', ARG: 'AR', MEX: 'MX', CAN: 'CA', AUS: 'AU',
  KOR: 'KR', IDN: 'ID', SAU: 'SA', ZAF: 'ZA', NGA: 'NG',
  EGY: 'EG', POL: 'PL', VNM: 'VN', THA: 'TH',
}
