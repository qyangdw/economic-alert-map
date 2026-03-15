'use client'

import dynamic from 'next/dynamic'
import { Header } from './header'
import { FilterBar } from './filter-bar'
import { LeftPanel } from './left-panel'
import { RightPanel } from './right-panel'
import { useEvents } from '@/hooks/use-events'

// Fix: dynamic import with ssr:false prevents MapLibre SSR crash
const CrisisMap = dynamic(
  () => import('@/components/map/crisis-map').then(m => ({ default: m.CrisisMap })),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[var(--accent-amber)] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-[var(--text-secondary)]">Loading map…</span>
        </div>
      </div>
    ),
  }
)

function MapContainer() {
  // Load events here so they're available before map renders
  useEvents()
  return <CrisisMap />
}

export function Dashboard() {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      <FilterBar />

      <div className="flex flex-1 overflow-hidden">
        <LeftPanel />

        <div className="flex-1 relative">
          <MapContainer />
        </div>

        <RightPanel />
      </div>
    </div>
  )
}
