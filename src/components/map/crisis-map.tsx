'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Map, { Marker, Popup } from 'react-map-gl/maplibre'
import type { MapRef } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useEventStore } from '@/stores/event-store'
import { useMapStore } from '@/stores/map-store'
import { useThemeStore } from '@/stores/theme-store'
import { useLocale } from '@/lib/locale-context'
import { matchesRegion } from '@/lib/regions'
import { MarkerDot } from './marker-dot'
import { MarkerPopup } from './marker-popup'
import { CpiOverlay } from './cpi-overlay'
import { TrendingUp } from 'lucide-react'

const STYLES = {
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
} as const

const legendKeys = ['critical', 'high', 'medium', 'low', 'info'] as const
const legendColors: Record<string, string> = {
  critical: 'var(--accent-red)',
  high: 'var(--accent-orange)',
  medium: 'var(--accent-yellow)',
  low: 'var(--accent-blue)',
  info: 'var(--accent-green)',
}

export function CrisisMap() {
  const mapRef = useRef<MapRef>(null)
  const events = useEventStore((s) => s.events)
  const region = useEventStore((s) => s.region)
  const selectedId = useEventStore((s) => s.selectedEventId)
  const select = useEventStore((s) => s.setSelectedEvent)
  const viewport = useMapStore((s) => s.viewport)
  const setViewport = useMapStore((s) => s.setViewport)
  const theme = useThemeStore((s) => s.theme)
  const { dict } = useLocale()
  const [showCpi, setShowCpi] = useState(false)

  const selectedEvent = events.find((e) => e.id === selectedId)

  const prevViewport = useRef(viewport)
  useEffect(() => {
    if (viewport !== prevViewport.current) {
      prevViewport.current = viewport
      mapRef.current?.flyTo({
        center: [viewport.longitude, viewport.latitude],
        zoom: viewport.zoom,
        duration: 1500,
      })
    }
  }, [viewport])

  const onMove = useCallback(
    (evt: { viewState: { latitude: number; longitude: number; zoom: number } }) => {
      setViewport(evt.viewState)
    },
    [setViewport],
  )

  const geoEvents = events.filter((e) => {
    if (!e.location) return false
    const text = `${e.title} ${e.summary} ${e.location.name}`
    return matchesRegion(region, text, e.location.country)
  })

  // Economic/trade events rendered on top
  const standardEvents = geoEvents.filter(
    (e) => !['tariff', 'trade', 'economic'].includes(e.category),
  )
  const econEvents = geoEvents.filter(
    (e) => ['tariff', 'trade', 'economic'].includes(e.category),
  )

  return (
    <div className="relative w-full h-full">
      <Map
        ref={mapRef}
        initialViewState={viewport}
        onMove={onMove}
        mapStyle={STYLES[theme]}
        style={{ width: '100%', height: '100%' }}
        onLoad={(evt) => evt.target.scrollZoom.setWheelZoomRate(1 / 100)}
        attributionControl={false}
      >
        <CpiOverlay visible={showCpi} />

        {standardEvents.map((e) => (
          <Marker
            key={e.id}
            latitude={e.location!.lat}
            longitude={e.location!.lng}
            anchor="center"
          >
            <MarkerDot event={e} onClick={() => select(e.id)} />
          </Marker>
        ))}

        {econEvents.map((e) => (
          <Marker
            key={e.id}
            latitude={e.location!.lat}
            longitude={e.location!.lng}
            anchor="center"
          >
            <MarkerDot event={e} onClick={() => select(e.id)} />
          </Marker>
        ))}

        {selectedEvent?.location && (
          <Popup
            latitude={selectedEvent.location.lat}
            longitude={selectedEvent.location.lng}
            onClose={() => select(null)}
            closeOnClick={false}
            anchor="bottom"
            offset={12}
          >
            <MarkerPopup event={selectedEvent} />
          </Popup>
        )}
      </Map>

      {/* CPI overlay toggle */}
      <button
        onClick={() => setShowCpi(!showCpi)}
        className={`absolute top-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
          showCpi
            ? 'bg-[var(--accent-amber)] border-[var(--accent-amber)] text-black'
            : 'bg-[var(--bg-secondary)]/90 border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
        }`}
      >
        <TrendingUp size={13} />
        {dict.map.cpiToggle}
      </button>

      {/* Legend */}
      <div className="absolute bottom-3 right-3 z-10 bg-[var(--bg-secondary)]/90 border border-[var(--border)] rounded-lg px-3 py-2 text-[10px] flex flex-col gap-1.5">
        {legendKeys.map((key) => (
          <div key={key} className="flex items-center gap-1.5">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full border border-black/30"
              style={{ background: legendColors[key] }}
            />
            <span className="text-[var(--text-secondary)]">{dict.levels[key] ?? key}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 mt-0.5 pt-1.5 border-t border-[var(--border)]">
          <span
            className="inline-block w-2.5 h-2.5 border border-[rgba(245,158,11,0.6)]"
            style={{ background: 'var(--accent-amber)', transform: 'rotate(45deg)', borderRadius: 1 }}
          />
          <span className="text-[var(--text-secondary)]">Trade/Tariff</span>
        </div>
      </div>
    </div>
  )
}
