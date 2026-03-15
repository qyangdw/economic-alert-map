'use client'

import { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import Map, { Source, Layer, Popup } from 'react-map-gl/maplibre'
import type { MapRef, MapLayerMouseEvent } from 'react-map-gl/maplibre'
import type { LayerSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useEventStore } from '@/stores/event-store'
import { useMapStore } from '@/stores/map-store'
import { useThemeStore } from '@/stores/theme-store'
import { useLocale } from '@/lib/locale-context'
import { matchesRegion } from '@/lib/regions'
import { MarkerPopup } from './marker-popup'
import { TrendingUp } from 'lucide-react'
import useSWR from 'swr'
import type { CpiDataPoint } from '@/types'
import { cpiColor } from '@/lib/cpi-data'
import type { CrisisEvent } from '@/types'

const STYLES = {
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
}

// Threat level colours
const LEVEL_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#3b82f6',
  info: '#22c55e',
}

// Category → colour for economic events (amber diamond)
const ECON_CATS = new Set(['tariff', 'trade', 'economic'])

const fetcher = async (url: string) => {
  const r = await fetch(url); if (!r.ok) throw new Error('fetch'); const j = await r.json(); return j.data ?? []
}

function buildEventGeoJSON(events: CrisisEvent[]) {
  return {
    type: 'FeatureCollection' as const,
    features: events
      .filter(e => e.location)
      .map(e => ({
        type: 'Feature' as const,
        id: e.id,
        geometry: { type: 'Point' as const, coordinates: [e.location!.lng, e.location!.lat] },
        properties: {
          id: e.id,
          title: e.title,
          summary: e.summary,
          level: e.level,
          category: e.category,
          source: e.source,
          timestamp: e.timestamp,
          url: e.url ?? null,
          locationName: e.location!.name,
          color: ECON_CATS.has(e.category) ? '#f59e0b' : LEVEL_COLORS[e.level] ?? '#3b82f6',
          isEcon: ECON_CATS.has(e.category) ? 1 : 0,
          radius: e.level === 'critical' ? 10 : e.level === 'high' ? 8 : e.level === 'medium' ? 6 : 5,
        },
      })),
  }
}

function buildCpiGeoJSON(data: CpiDataPoint[]) {
  return {
    type: 'FeatureCollection' as const,
    features: data.map(p => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [p.lng, p.lat] },
      properties: {
        country: p.country,
        cpi: p.cpi,
        label: `${p.country}\n${p.cpi > 0 ? '+' : ''}${p.cpi}%`,
        color: cpiColor(p.cpi),
        trendArrow: p.trend === 'up' ? ' ↑' : p.trend === 'down' ? ' ↓' : ' →',
      },
    })),
  }
}

export function CrisisMap() {
  const mapRef = useRef<MapRef>(null)
  const events = useEventStore(s => s.events)
  const filters = useEventStore(s => s.filters)
  const region = useEventStore(s => s.region)
  const selectedId = useEventStore(s => s.selectedEventId)
  const select = useEventStore(s => s.setSelectedEvent)
  const viewport = useMapStore(s => s.viewport)
  const setViewport = useMapStore(s => s.setViewport)
  const theme = useThemeStore(s => s.theme)
  const { dict } = useLocale()

  const [showCpi, setShowCpi] = useState(false)
  const [popup, setPopup] = useState<{ lng: number; lat: number; event: CrisisEvent } | null>(null)

  const { data: cpiData } = useSWR<CpiDataPoint[]>(showCpi ? '/api/cpi' : null, fetcher, { refreshInterval: 3_600_000 })

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (!e.location) return false
      const text = `${e.title} ${e.summary} ${e.location.name}`
      if (!matchesRegion(region, text, e.location.country)) return false
      if (filters.categories.length && !filters.categories.includes(e.category)) return false
      if (filters.levels.length && !filters.levels.includes(e.level)) return false
      if (filters.search) {
        const q = filters.search.toLowerCase()
        if (!text.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [events, region, filters])

  const eventGeoJSON = useMemo(() => buildEventGeoJSON(filteredEvents), [filteredEvents])
  const cpiGeoJSON = useMemo(() => cpiData ? buildCpiGeoJSON(cpiData) : null, [cpiData])

  // Find selected event for popup
  const selectedEvent = selectedId ? events.find(e => e.id === selectedId) : null

  // Fly to when viewport changes from store
  const prevViewport = useRef(viewport)
  useEffect(() => {
    if (viewport !== prevViewport.current) {
      prevViewport.current = viewport
      mapRef.current?.flyTo({ center: [viewport.longitude, viewport.latitude], zoom: viewport.zoom, duration: 1500 })
    }
  }, [viewport])

  const onMove = useCallback(
    (evt: { viewState: { latitude: number; longitude: number; zoom: number } }) => setViewport(evt.viewState),
    [setViewport],
  )

  // Click on event circle
  const onMapClick = useCallback((evt: MapLayerMouseEvent) => {
    const features = evt.features
    if (!features?.length) { select(null); setPopup(null); return }
    const f = features[0]
    const props = f.properties as Record<string, unknown>
    const eventId = String(props.id ?? '')
    const found = events.find(e => e.id === eventId)
    if (!found?.location) return
    select(found.id)
    setPopup({ lng: found.location.lng, lat: found.location.lat, event: found })
  }, [events, select])

  // Layer specs
  const circleLayer: LayerSpecification = {
    id: 'events-circles',
    type: 'circle',
    source: 'events',
    paint: {
      'circle-radius': ['get', 'radius'],
      'circle-color': ['get', 'color'],
      'circle-opacity': 0.85,
      'circle-stroke-width': 1.5,
      'circle-stroke-color': 'rgba(0,0,0,0.4)',
    },
  }

  const cpiCircleLayer: LayerSpecification = {
    id: 'cpi-circles',
    type: 'circle',
    source: 'cpi',
    paint: {
      'circle-radius': 28,
      'circle-color': ['get', 'color'],
      'circle-opacity': 0.12,
      'circle-stroke-width': 1,
      'circle-stroke-color': ['get', 'color'],
      'circle-stroke-opacity': 0.5,
    },
  }

  const cpiLabelLayer: LayerSpecification = {
    id: 'cpi-labels',
    type: 'symbol',
    source: 'cpi',
    layout: {
      'text-field': ['concat', ['get', 'country'], '\n', ['concat', ['case', ['>', ['get', 'cpi'], 0], '+', ''], ['to-string', ['get', 'cpi']], '%', ['get', 'trendArrow']]],
      'text-size': 9,
      'text-anchor': 'center',
      'text-allow-overlap': false,
      'text-font': ['Noto Sans Regular'],
      'text-line-height': 1.4,
    },
    paint: {
      'text-color': ['get', 'color'],
      'text-halo-color': theme === 'dark' ? '#0a0a14' : '#ffffff',
      'text-halo-width': 1,
    },
  }

  return (
    <div className="relative w-full h-full">
      <Map
        ref={mapRef}
        initialViewState={viewport}
        onMove={onMove}
        mapStyle={STYLES[theme]}
        style={{ width: '100%', height: '100%' }}
        onLoad={evt => evt.target.scrollZoom.setWheelZoomRate(1 / 100)}
        attributionControl={false}
        interactiveLayerIds={['events-circles']}
        onClick={onMapClick}
        cursor="auto"
      >
        {/* CPI layer */}
        {showCpi && cpiGeoJSON && (
          <Source id="cpi" type="geojson" data={cpiGeoJSON}>
            <Layer {...cpiCircleLayer} />
            <Layer {...cpiLabelLayer} />
          </Source>
        )}

        {/* Event circles */}
        <Source id="events" type="geojson" data={eventGeoJSON}>
          <Layer {...circleLayer} />
        </Source>

        {/* Popup on click */}
        {popup && selectedEvent && (
          <Popup
            longitude={popup.lng}
            latitude={popup.lat}
            onClose={() => { select(null); setPopup(null) }}
            closeOnClick={false}
            anchor="bottom"
            offset={12}
          >
            <MarkerPopup event={selectedEvent} />
          </Popup>
        )}
      </Map>

      {/* CPI toggle */}
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
        {(['critical','high','medium','low','info'] as const).map(k => (
          <div key={k} className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: LEVEL_COLORS[k] }} />
            <span className="text-[var(--text-secondary)]">{dict.levels[k] ?? k}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 mt-0.5 pt-1.5 border-t border-[var(--border)]">
          <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: '#f59e0b', transform: 'rotate(45deg)' }} />
          <span className="text-[var(--text-secondary)]">Trade/Tariff</span>
        </div>
        {showCpi && (
          <div className="flex items-center gap-1.5 mt-0.5 pt-1.5 border-t border-[var(--border)]">
            <span className="inline-block w-2.5 h-2.5 rounded-full border" style={{ background: 'transparent', borderColor: '#22c55e' }} />
            <span className="text-[var(--text-secondary)]">CPI bubble</span>
          </div>
        )}
      </div>
    </div>
  )
}
