'use client'

import type { CrisisEvent, ThreatLevel, EventCategory } from '@/types'

const levelColors: Record<ThreatLevel, string> = {
  critical: 'var(--accent-red)',
  high: 'var(--accent-orange)',
  medium: 'var(--accent-yellow)',
  low: 'var(--accent-blue)',
  info: 'var(--accent-green)',
}

const levelSizes: Record<ThreatLevel, number> = {
  critical: 18, high: 14, medium: 11, low: 8, info: 6,
}

// Economic/trade events get a distinctive diamond shape with $ icon
const ECON_CATEGORIES: Set<EventCategory> = new Set(['tariff', 'trade', 'economic'])

export function MarkerDot({ event, onClick }: { event: CrisisEvent; onClick: () => void }) {
  const size = levelSizes[event.level]
  const color = levelColors[event.level]
  const isEcon = ECON_CATEGORIES.has(event.category)

  if (isEcon) {
    // Economic marker: amber-bordered square rotated 45° (diamond)
    const dimPx = size + 2
    return (
      <button
        onClick={onClick}
        className="relative cursor-pointer flex items-center justify-center"
        title={event.title}
        style={{ width: dimPx + 8, height: dimPx + 8 }}
      >
        <div
          className="flex items-center justify-center text-[7px] font-black text-black"
          style={{
            width: dimPx,
            height: dimPx,
            background: 'var(--accent-amber)',
            border: `1.5px solid ${color}`,
            borderRadius: 2,
            transform: 'rotate(45deg)',
            boxShadow: `0 0 6px var(--accent-amber)44`,
          }}
        />
        {event.sourceTier === 'private' && (
          <span className="absolute -top-1.5 -right-1.5 text-[8px]">&#128274;</span>
        )}
      </button>
    )
  }

  // Standard dot for non-economic events
  return (
    <button
      onClick={onClick}
      className="relative cursor-pointer"
      title={event.title}
    >
      <div
        className="rounded-full border border-black/30"
        style={{ width: size, height: size, background: color }}
      />
      {event.level === 'critical' && (
        <div
          className="absolute inset-0 rounded-full animate-ping opacity-40"
          style={{ background: color }}
        />
      )}
      {event.sourceTier === 'private' && (
        <span className="absolute -top-1 -right-1.5 text-[8px]">&#128274;</span>
      )}
    </button>
  )
}
