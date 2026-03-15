'use client'

import { useMarkets } from '@/hooks/use-markets'
import { useLocale } from '@/lib/locale-context'

export function RightPanel() {
  const { contracts, error, isLoading } = useMarkets()
  const { dict } = useLocale()

  return (
    <aside className="w-64 shrink-0 flex flex-col overflow-hidden bg-[var(--bg-primary)] border-l border-[var(--border)]">
      <div className="px-3 py-2 border-b border-[var(--border)] shrink-0">
        <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--accent-amber)]">
          Prediction Markets
        </div>
        <div className="text-[10px] text-[var(--text-secondary)] mt-0.5">Polymarket</div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
        {isLoading && (
          <div className="flex items-center justify-center h-32 text-xs text-[var(--text-secondary)]">
            {dict.polymarket.loading}
          </div>
        )}
        {error && (
          <div className="flex items-center justify-center h-32 text-xs text-[var(--accent-red)]">
            {dict.polymarket.error}
          </div>
        )}
        {contracts.map(c => {
          const pct = Math.round(c.probability)
          const barColor = pct > 70 ? 'var(--accent-red)' : pct > 40 ? 'var(--accent-yellow)' : 'var(--accent-green)'
          return (
            <a
              key={c.id}
              href={c.url ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] p-2.5 hover:border-[var(--accent-amber)]/40 transition-colors"
            >
              <p className="text-[11px] text-[var(--text-primary)] line-clamp-3 mb-2 leading-tight">
                {c.question}
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-primary)]">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: barColor }} />
                </div>
                <span className="text-xs font-bold shrink-0" style={{ color: barColor }}>
                  {pct}%
                </span>
              </div>
              {c.volume > 0 && (
                <div className="text-[9px] text-[var(--text-secondary)] mt-1">
                  Vol: ${c.volume.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
              )}
            </a>
          )
        })}
      </div>
    </aside>
  )
}
