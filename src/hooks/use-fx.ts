import useSWR from 'swr'
import type { FxRate } from '@/app/api/fx/route'

const fetcher = async (url: string) => {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`API ${r.status}`)
  const j = await r.json()
  if (!j.success) throw new Error(j.error ?? 'API error')
  return j.data ?? []
}

export function useFx() {
  const { data, error, isLoading } = useSWR<FxRate[]>(
    '/api/fx',
    fetcher,
    { refreshInterval: 600_000 },
  )
  return { rates: data ?? [], error, isLoading }
}
