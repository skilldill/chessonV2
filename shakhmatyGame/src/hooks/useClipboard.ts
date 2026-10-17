import { useEffect, useRef, useState } from 'react'

export function useClipboard() {
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(false)
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timeout.current), [])
  const copy = async (value: string) => {
    try { await navigator.clipboard.writeText(value); setCopied(true); setError(false); clearTimeout(timeout.current); timeout.current = setTimeout(() => setCopied(false), 2500) }
    catch { setError(true) }
  }
  return { copy, copied, error }
}
