import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

export function Dialog({ title, description, children, onClose, busy = false }: { title: string; description?: string; children?: ReactNode; onClose?: () => void; busy?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null)
  const id = useId()
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close() }, [])
  return <dialog ref={ref} className="dialog" aria-labelledby={`${id}-title`} aria-describedby={description ? `${id}-description` : undefined}
    onCancel={event => { event.preventDefault(); if (!busy) onClose?.() }}>
    {onClose && <button type="button" className="icon-button dialog-close" aria-label="Закрыть" title="Закрыть" disabled={busy} onClick={onClose}><X size={19} /></button>}
    <h2 id={`${id}-title`}>{title}</h2>
    {description && <p id={`${id}-description`} className="dialog-description">{description}</p>}
    {children}
  </dialog>
}
