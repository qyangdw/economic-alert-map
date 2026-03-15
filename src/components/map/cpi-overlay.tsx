'use client'

import useSWR from 'swr'
import { Marker } from 'react-map-gl/maplibre'
import type { CpiDataPoint } from '@/types'
import { cpiColor, cpiLabel } from '@/lib/cpi-data'
import { useState } from 'react'

const fetcher = async (url: string) => {
  const r = await fetch(url)
  if (!r.ok) throw new Error('CPI fetch failed')
  const j = await r.json()
  return j.data ?? []
}

function CpiMarker({ point }: { point: CpiDataPoint }) {
  const [hovered, setHovered] = useState(false)
  const color = cpiColor(point.cpi)
  const isExtreme = point.cpi >= 20

  return (
    <Marker
      latitude={point.lat}
      longitude={point.lng}
      anchor="center"
    >
      <div
        className="relative cursor-default"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* CPI badge */}
        <div
          className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold border select-none"
          style={{
            background: `${color}22`,
            borderColor: `${color}55`,
            color,
            boxShadow: isExtreme ? `0 0 8px ${color}44` : undefined,
          }}
        >
          <span>{point.country}</span>
          <span className="opacity-70">|</span>
          <span>{point.cpi > 0 ? '+' : ''}{point.cpi}%</span>
          <span>{point.trend === 'up' ? '↑' : point.trend === 'down' ? '↓' : '→'}</span>
        </div>

        {/* Tooltip on hover */}
        {hovered && (
          <div
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 whitespace-nowrap rounded-lg border px-2.5 py-2 text-[10px] pointer-events-none"
            style={{
              background: 'var(--bg-secondary)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            }}
          >
            <div className="font-bold text-xs mb-0.5">{point.country}</div>
            <div style={{ color }}>CPI: {point.cpi > 0 ? '+' : ''}{point.cpi}% ({point.month})</div>
            <div className="text-[var(--text-secondary)] mt-0.5">{cpiLabel(point.cpi)}</div>
          </div>
        )}
      </div>
    </Marker>
  )
}

export function CpiOverlay({ visible }: { visible: boolean }) {
  const { data } = useSWR<CpiDataPoint[]>(
    visible ? '/api/cpi' : null,
    fetcher,
    { refreshInterval: 3_600_000 }, // refresh every hour
  )

  if (!visible || !data) return null

  return (
    <>
      {data.map((point) => (
        <CpiMarker key={point.countryCode} point={point} />
      ))}
    </>
  )
}
