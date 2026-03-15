import type { CpiDataPoint } from '@/types'

// Static CPI dataset — updated quarterly from World Bank / national stats offices
// Source: World Bank (free API), national central banks
// All values = annual % change, approximate as of Q1 2026
export const CPI_DATA: CpiDataPoint[] = [
  { country: 'USA', countryCode: 'US', lat: 38.9, lng: -95.7, cpi: 3.0, month: 'Jan 2026', trend: 'down' },
  { country: 'Euro Area', countryCode: 'EU', lat: 50.1, lng: 9.0, cpi: 2.3, month: 'Jan 2026', trend: 'down' },
  { country: 'China', countryCode: 'CN', lat: 35.9, lng: 104.2, cpi: 0.5, month: 'Jan 2026', trend: 'stable' },
  { country: 'Japan', countryCode: 'JP', lat: 36.2, lng: 138.3, cpi: 3.5, month: 'Jan 2026', trend: 'up' },
  { country: 'UK', countryCode: 'GB', lat: 52.4, lng: -1.5, cpi: 2.6, month: 'Jan 2026', trend: 'down' },
  { country: 'Germany', countryCode: 'DE', lat: 51.2, lng: 10.4, cpi: 2.2, month: 'Jan 2026', trend: 'down' },
  { country: 'France', countryCode: 'FR', lat: 46.2, lng: 2.2, cpi: 1.8, month: 'Jan 2026', trend: 'down' },
  { country: 'Brazil', countryCode: 'BR', lat: -14.2, lng: -51.9, cpi: 4.9, month: 'Jan 2026', trend: 'up' },
  { country: 'India', countryCode: 'IN', lat: 20.6, lng: 78.9, cpi: 4.8, month: 'Jan 2026', trend: 'stable' },
  { country: 'Russia', countryCode: 'RU', lat: 61.5, lng: 90.4, cpi: 9.5, month: 'Jan 2026', trend: 'up' },
  { country: 'Turkey', countryCode: 'TR', lat: 38.9, lng: 35.2, cpi: 43.0, month: 'Jan 2026', trend: 'down' },
  { country: 'Argentina', countryCode: 'AR', lat: -38.4, lng: -63.6, cpi: 118.0, month: 'Jan 2026', trend: 'down' },
  { country: 'Mexico', countryCode: 'MX', lat: 23.6, lng: -102.6, cpi: 3.8, month: 'Jan 2026', trend: 'stable' },
  { country: 'Canada', countryCode: 'CA', lat: 56.1, lng: -106.3, cpi: 2.3, month: 'Jan 2026', trend: 'down' },
  { country: 'Australia', countryCode: 'AU', lat: -25.3, lng: 133.8, cpi: 2.7, month: 'Jan 2026', trend: 'down' },
  { country: 'S.Korea', countryCode: 'KR', lat: 35.9, lng: 127.8, cpi: 2.1, month: 'Jan 2026', trend: 'stable' },
  { country: 'Indonesia', countryCode: 'ID', lat: -0.8, lng: 113.9, cpi: 2.8, month: 'Jan 2026', trend: 'stable' },
  { country: 'Saudi Arabia', countryCode: 'SA', lat: 23.9, lng: 45.1, cpi: 1.8, month: 'Jan 2026', trend: 'stable' },
  { country: 'S.Africa', countryCode: 'ZA', lat: -30.6, lng: 22.9, cpi: 4.5, month: 'Jan 2026', trend: 'down' },
  { country: 'Nigeria', countryCode: 'NG', lat: 9.1, lng: 8.7, cpi: 24.5, month: 'Jan 2026', trend: 'down' },
  { country: 'Egypt', countryCode: 'EG', lat: 26.8, lng: 30.8, cpi: 26.0, month: 'Jan 2026', trend: 'down' },
  { country: 'Poland', countryCode: 'PL', lat: 51.9, lng: 19.1, cpi: 4.9, month: 'Jan 2026', trend: 'up' },
  { country: 'Vietnam', countryCode: 'VN', lat: 14.1, lng: 108.3, cpi: 3.6, month: 'Jan 2026', trend: 'up' },
  { country: 'Thailand', countryCode: 'TH', lat: 15.9, lng: 100.9, cpi: 1.1, month: 'Jan 2026', trend: 'stable' },
]

// Color-code CPI by severity
export function cpiColor(cpi: number): string {
  if (cpi >= 50) return '#dc2626'   // extreme: red
  if (cpi >= 20) return '#f97316'   // very high: orange
  if (cpi >= 8) return '#eab308'    // high: yellow
  if (cpi >= 4) return '#f59e0b'    // elevated: amber
  if (cpi >= 2) return '#22c55e'    // target: green
  return '#3b82f6'                  // low / deflation risk: blue
}

export function cpiLabel(cpi: number): string {
  if (cpi >= 50) return 'Extreme inflation'
  if (cpi >= 20) return 'Very high inflation'
  if (cpi >= 8) return 'High inflation'
  if (cpi >= 4) return 'Above target'
  if (cpi >= 2) return 'On target'
  return 'Low / deflation risk'
}
