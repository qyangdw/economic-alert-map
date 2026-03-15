'use client'

import type { CrisisEvent, EventCategory, ThreatLevel } from '@/types'
import { useEventStore } from '@/stores/event-store'
import { useMapStore } from '@/stores/map-store'
import { useLocale } from '@/lib/locale-context'
import { timeAgo } from '@/lib/format'
import {
  Crosshair, MessageSquare, Shield, Handshake, TrendingUp,
  AlertTriangle, CloudLightning, BarChart3, Activity, MapPin,
  PackageX, ArrowLeftRight,
} from 'lucide-react'

const categoryIcons: Record<EventCategory, React.ElementType> = {
  conflict: Crosshair,
  statement: MessageSquare,
  military: Shield,
  diplomatic: Handshake,
  economic: TrendingUp,
  terrorism: AlertTriangle,
  disaster: CloudLightning,
  prediction: BarChart3,
  earthquake: Activity,
  tariff: PackageX,
  trade: ArrowLeftRight,
}

const levelColors: Record<ThreatLevel, string> = {
  critical: 'var(--accent-red)',
  high: 'var(--accent-orange)',
  medium: 'var(--accent-yellow)',
  low: 'var(--accent-blue)',
  info: 'var(--accent-green)',
}

const categoryBadgeClass: Partial<Record<EventCategory, string>> = {
  tariff: 'badge-tariff',
  trade: 'badge-trade',
  economic: 'badge-economic',
}

export function EventCard({ event }: { event: CrisisEvent }) {
  const selectedId = useEventStore((s) => s.selectedEventId)
  const select = useEventStore((s) => s.setSelectedEvent)
  const flyTo = useMapStore((s) => s.flyTo)
  const { dict } = useLocale()

  const Icon = categoryIcons[event.category]
  const dotColor = levelColors[event.level]
  const isSelected = selectedId === event.id
  const badgeClass = categoryBadgeClass[event.category]

  const handleClick = () => {
    select(event.id)
    if (event.location) flyTo(event.location.lat, event.location.lng)
  }

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left p-4 rounded-xl border transition-all ${
        isSelected
          ? 'bg-[var(--bg-tertiary)] border-[var(--accent-amber)] shadow-[0_0_12px_rgba(245,158,11,0.15)]'
          : 'bg-[var(--bg-secondary)] border-[var(--border)] hover:border-[var(--accent-amber)]/40 hover:bg-[var(--bg-tertiary)]/60'
      }`}
    >
      {/* Top row: level dot + icon + category badge + time */}
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: dotColor }} />
        <Icon size={14} className="text-[var(--text-secondary)] shrink-0" />
        {badgeClass && (
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wide ${badgeClass}`}>
            {dict.categories[event.category] ?? event.category}
          </span>
        )}
        <span className="text-[10px] text-[var(--text-secondary)] ml-auto shrink-0">
          {timeAgo(event.timestamp, { dict })}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-[var(--text-primary)] leading-snug mb-1.5">
        {event.title}
      </h3>

      {/* Summary — 3 lines */}
      <p className="text-xs text-[var(--text-secondary)] line-clamp-3 leading-relaxed mb-3">
        {event.summary}
      </p>

      {/* Bottom row: location + level badge + source */}
      <div className="flex items-center gap-2 text-[10px] text-[var(--text-secondary)]">
        {event.location && (
          <span className="flex items-center gap-0.5 min-w-0">
            <MapPin size={10} className="shrink-0" />
            <span className="truncate">{event.location.name}</span>
          </span>
        )}
        <span className="ml-auto flex items-center gap-1.5 shrink-0">
          <span className="px-1.5 py-0.5 rounded border border-[var(--border)] text-[9px] uppercase tracking-wide">
            {event.level}
          </span>
          <span className="text-[var(--text-secondary)]">{event.source}</span>
          {event.sourceTier === 'private' && <span title="Private source">&#128274;</span>}
        </span>
      </div>
    </button>
  )
}
