'use client'

import { useIndicators } from '@/hooks/use-indicators'
import { useFx } from '@/hooks/use-fx'
import { TrendingUp, TrendingDown } from 'lucide-react'
import type { MarketIndicator } from '@/types'
import type { FxRate } from '@/app/api/fx/route'

const STOCK_NAMES = new Set(['S&P 500','NASDAQ','DAX','Nikkei','SSE','Hang Seng','WTI Oil','Gold','Nat Gas','VIX'])
const CRYPTO_NAMES = new Set(['BTC','ETH','BNB','SOL','USDT','XRP'])

function ChangeCell({ value }: { value: number }) {
  const pos = value >= 0
  const color = pos ? 'var(--accent-green)' : 'var(--accent-red)'
  const Icon = pos ? TrendingUp : TrendingDown
  return (
    <span className="flex items-center gap-0.5 text-[10px]" style={{ color }}>
      <Icon size={9} />
      {pos ? '+' : ''}{value.toFixed(2)}%
    </span>
  )
}

function IndicatorRow({ item }: { item: MarketIndicator }) {
  return (
    <div className="flex items-center justify-between py-1 px-2 rounded hover:bg-[var(--bg-tertiary)] transition-colors">
      <span className="text-[11px] font-medium text-[var(--text-secondary)] w-20 truncate">{item.name}</span>
      <span className="text-[11px] text-[var(--text-primary)] font-mono">
        {item.price >= 1000
          ? item.price.toLocaleString(undefined, { maximumFractionDigits: 0 })
          : item.price >= 1
          ? item.price.toLocaleString(undefined, { maximumFractionDigits: 2 })
          : item.price.toFixed(4)}
      </span>
      <ChangeCell value={item.changePercent} />
    </div>
  )
}

function FxRow({ rate }: { rate: FxRate }) {
  return (
    <div className="flex items-center justify-between py-1 px-2 rounded hover:bg-[var(--bg-tertiary)] transition-colors">
      <span className="text-[11px] font-medium text-[var(--text-secondary)] w-20">
        {rate.base}/{rate.quote}
      </span>
      <span className="text-[11px] text-[var(--text-primary)] font-mono">
        {rate.rate >= 100
          ? rate.rate.toFixed(2)
          : rate.rate >= 1
          ? rate.rate.toFixed(4)
          : rate.rate.toFixed(6)}
      </span>
      {rate.change24h !== undefined ? (
        <ChangeCell value={rate.change24h} />
      ) : (
        <span className="text-[10px] text-[var(--text-secondary)]">—</span>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <div className="px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-[var(--accent-amber)] border-b border-[var(--border)]">
        {title}
      </div>
      {children}
    </div>
  )
}

export function LeftPanel() {
  const { indicators } = useIndicators()
  const { rates } = useFx()

  const stocks = indicators.filter(i => STOCK_NAMES.has(i.name))
  const crypto = indicators.filter(i => CRYPTO_NAMES.has(i.name))
  const eurRates = rates.filter(r => r.base === 'EUR')
  const cnyRates = rates.filter(r => r.base === 'CNY')

  return (
    <aside className="w-56 shrink-0 flex flex-col overflow-y-auto bg-[var(--bg-primary)] border-r border-[var(--border)] text-xs">
      {/* Stocks & Indices */}
      <Section title="Indices">
        {stocks.filter(i => !['WTI Oil','Gold','Nat Gas','VIX'].includes(i.name)).map(i => (
          <IndicatorRow key={i.symbol} item={i} />
        ))}
      </Section>

      <Section title="Commodities">
        {stocks.filter(i => ['WTI Oil','Gold','Nat Gas'].includes(i.name)).map(i => (
          <IndicatorRow key={i.symbol} item={i} />
        ))}
        {stocks.filter(i => i.name === 'VIX').map(i => (
          <IndicatorRow key={i.symbol} item={i} />
        ))}
      </Section>

      {/* Crypto */}
      <Section title="Crypto (USD)">
        {crypto.map(i => (
          <IndicatorRow key={i.symbol} item={i} />
        ))}
      </Section>

      {/* EUR FX */}
      <Section title="EUR/Major">
        {eurRates.map(r => (
          <FxRow key={`${r.base}/${r.quote}`} rate={r} />
        ))}
      </Section>

      {/* CNY FX */}
      <Section title="CNY/Major">
        {cnyRates.map(r => (
          <FxRow key={`${r.base}/${r.quote}`} rate={r} />
        ))}
      </Section>
    </aside>
  )
}
