'use client'

import { useEventStore } from '@/stores/event-store'
import { useLocale } from '@/lib/locale-context'
import { useMapStore } from '@/stores/map-store'
import { extractGovResponses } from '@/lib/actors'
import { timeAgo } from '@/lib/format'
import { ExternalLink, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import type { CrisisEvent } from '@/types'

function ResponseCard({ event }: { event: CrisisEvent }) {
  const select = useEventStore((s) => s.setSelectedEvent)
  const flyTo = useMapStore((s) => s.flyTo)
  const { dict } = useLocale()

  const handleClick = () => {
    select(event.id)
    if (event.location) flyTo(event.location.lat, event.location.lng)
  }

  const levelColor =
    event.level === 'critical' ? 'var(--accent-red)' :
    event.level === 'high' ? 'var(--accent-orange)' :
    event.level === 'medium' ? 'var(--accent-yellow)' :
    event.level === 'low' ? 'var(--accent-blue)' :
    'var(--accent-green)'

  return (
    <div className="flex gap-2 py-2 border-b border-[var(--border)] last:border-0">
      <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: levelColor }} />
      <div className="min-w-0 flex-1">
        <button
          onClick={handleClick}
          className="text-xs text-[var(--text-primary)] leading-snug text-left hover:text-[var(--accent-amber)] transition-colors line-clamp-2"
        >
          {event.title}
        </button>
        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[var(--text-secondary)]">
          <span>{timeAgo(event.timestamp, { dict })}</span>
          {event.url && (
            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-0.5 text-[var(--accent-blue)] hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {dict.map.readArticle} <ExternalLink size={9} />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

function ActorBlock({
  actor, flag, role, responses,
}: {
  actor: string
  flag: string
  role: string
  responses: CrisisEvent[]
}) {
  const [expanded, setExpanded] = useState(false)
  const shown = expanded ? responses : responses.slice(0, 2)

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-[var(--bg-tertiary)] transition-colors"
      >
        <span className="text-base shrink-0">{flag}</span>
        <div className="min-w-0 flex-1 text-left">
          <div className="text-xs font-semibold text-[var(--text-primary)] truncate">{actor}</div>
          <div className="text-[10px] text-[var(--text-secondary)] truncate">{role}</div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[var(--accent-amber)]/15 text-[var(--accent-amber)] border border-[var(--accent-amber)]/20">
            {responses.length}
          </span>
          <ChevronRight
            size={13}
            className={`text-[var(--text-secondary)] transition-transform ${expanded ? 'rotate-90' : ''}`}
          />
        </div>
      </button>
      {expanded && (
        <div className="px-3 pb-2 border-t border-[var(--border)]">
          {shown.map((e) => <ResponseCard key={e.id} event={e} />)}
          {!expanded && responses.length > 2 && (
            <button
              onClick={() => setExpanded(true)}
              className="text-[10px] text-[var(--accent-blue)] hover:underline mt-1"
            >
              +{responses.length - 2} more responses
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export function GovResponsePanel() {
  const events = useEventStore((s) => s.events)
  const { dict } = useLocale()

  const govResponses = extractGovResponses(events)

  return (
    <div className="flex flex-col gap-3 overflow-hidden flex-1">
      {/* Header */}
      <div className="shrink-0">
        <h2 className="text-sm font-bold text-[var(--text-primary)]">{dict.govResponse.title}</h2>
        <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">{dict.govResponse.subtitle}</p>
      </div>

      {/* List */}
      {govResponses.length === 0 ? (
        <div className="flex items-center justify-center h-40 text-sm text-[var(--text-secondary)]">
          {dict.govResponse.empty}
        </div>
      ) : (
        <div className="flex flex-col gap-2 overflow-y-auto flex-1 pr-1">
          {govResponses.map(({ actor, flag, role, responses }) => (
            <ActorBlock
              key={actor}
              actor={actor}
              flag={flag}
              role={role}
              responses={responses}
            />
          ))}
        </div>
      )}
    </div>
  )
}
