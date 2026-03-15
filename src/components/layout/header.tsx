'use client'

import { useLocale } from '@/lib/locale-context'
import { TimezoneSelector } from '@/components/timezone-selector'
import { ThemeToggle } from './theme-toggle'
import { LocaleSwitcher } from './locale-switcher'

export function Header() {
  const { dict } = useLocale()

  return (
    <header className="relative z-40 flex items-center gap-3 px-4 h-10 bg-[var(--bg-secondary)] border-b border-[var(--border)] shrink-0">
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-sm font-bold text-[var(--text-primary)] tracking-tight">
          {dict.header.title}
        </span>
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--accent-green)]/15 text-[9px] font-semibold text-[var(--accent-green)]">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-green)] opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--accent-green)]" />
          </span>
          {dict.header.live}
        </span>
      </div>
      <div className="flex-1" />
      <TimezoneSelector />
      <ThemeToggle />
      <LocaleSwitcher />
    </header>
  )
}
