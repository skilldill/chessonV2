import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { trackPage } from '../lib/analytics'

export function usePageAnalytics() {
  const { pathname } = useLocation()
  const lastPage = useRef<string | undefined>(undefined)
  useEffect(() => {
    const current = new URL(pathname, window.location.origin).href
    if (lastPage.current === current) return
    if (trackPage(pathname, lastPage.current)) lastPage.current = current
  }, [pathname])
}
