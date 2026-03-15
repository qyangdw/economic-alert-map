'use client'

import { useEventStore } from '@/stores/event-store'
import { useLocale } from '@/lib/locale-context'
import { Search, X } from 'lucide-react'
import { regions } from '@/lib/regions'
import type { Region } from '@/lib/regions'
import type { EventCategory, ThreatLevel } from '@/types'

const CATEGORIES: EventCategory[] = [
  'tariff', 'trade', 'economic', 'diplomatic', 'statement',
  'conflict', 'military', 'terrorism', 'disaster', 'earthquake',
]
const LEVELS: ThreatLevel[] = ['critical', 'high', 'medium', 'low', 'info']

const levelColors: Record<ThreatLevel, string> = {
  critical: 'var(--accent-red)',
  high: 'var(--accent-orange)',
  medium: 'var(--accent-yellow)',
  low: 'var(--accent-blue)',
  info: 'var(--accent-green)',
}

export function FilterBar() {
  const filters = useEventStore(s => s.filters)
  const setFilters = useEventStore(s => s.setFilters)
  const region = useEventStore(s => s.region)
  const setRegion = useEventStore(s => s.setRegion)
  const { dict } = useLocale()

  const toggleCat = (c: EventCategory) =>
    setFilters({ categories: filters.categories.includes(c) ? filters.categories.filter(x => x !== c) : [...filters.categories, c] })

  const toggleLevel = (l: ThreatLevel) =>
    setFilters({ levels: filters.levels.includes(l) ? filters.levels.filter(x => x !== l) : [...filters.levels, l] })

  const hasFilters = filters.categories.length > 0 || filters.levels.length > 0 || filters.search

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-secondary)] border-b border-[var(--border)] overflow-x-auto no-scrollbar shrink-0">
      {/* Region */}
      <div className="flex gap-1 shrink-0">
        {regions.map((r: Region) => (
          <button
            key={r}
            onClick={() => setRegion(r)}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors whitespace-nowrap ${
              region === r
                ? 'bg-[var(--accent-amber)] border-[var(--accent-amber)] text-black'
                : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-amber)]/40'
            }`}
          >
            {dict.regions[r] ?? r}
          </button>
        ))}
      </div>

      <div className="w-px h-4 bg-[var(--border)] shrink-0" />

      {/* Categories */}
      <div className="flex gap-1 shrink-0">
        {CATEGORIES.map(c => (
          <button
            key={c}
            onClick={() => toggleCat(c)}
            className={`px-2 py-0.5 rounded-full text-[10px] border transition-colors whitespace-nowrap ${
              filters.categories.includes(c)
                ? 'bg-[var(--accent-amber)] border-[var(--accent-amber)] text-black'
                : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]'
            }`}
          >
            {dict.categories[c] ?? c}
          </button>
        ))}
      </div>

      <div className="w-px h-4 bg-[var(--border)] shrink-0" />

      {/* Levels */}
      <div className="flex gap-1 shrink-0">
        {LEVELS.map(l => (
          <button
            key={l}
            onClick={() => toggleLevel(l)}
            className={`px-2 py-0.5 rounded-full text-[10px] border transition-colors whitespace-nowrap ${
              filters.levels.includes(l) ? 'text-white border-transparent' : 'border-[var(--border)] text-[var(--text-secondary)]'
            }`}
            style={filters.levels.includes(l) ? { background: levelColors[l] } : undefined}
          >
            {dict.levels[l] ?? l}
          </button>
        ))}
      </div>

      <div className="w-px h-4 bg-[var(--border)] shrink-0" />

      {/* Search */}
      <div className="relative shrink-0">
        <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
        <input
          type="text"
          placeholder={dict.filters.search}
          value={filters.search}
          onChange={e => setFilters({ search: e.target.value })}
          className="pl-6 pr-3 py-0.5 rounded bg-[var(--bg-tertiary)] border border-[var(--border)] text-[11px] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-amber)] w-40"
        />
      </div>

      {/* Clear all */}
      {hasFilters && (
        <button
          onClick={() => { setFilters({ categories: [], levels: [], search: '' }); setRegion('all') }}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-[var(--accent-red)] border border-[var(--accent-red)]/30 hover:bg-[var(--accent-red)]/10 transition-colors shrink-0"
        >
          <X size={10} /> Clear
        </button>
      )}
    </div>
  )
}
