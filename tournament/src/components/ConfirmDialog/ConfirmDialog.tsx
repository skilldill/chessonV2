import { useEffect } from 'react'
import { useI18n } from '../../i18n/i18n'

type ConfirmDialogProps = {
  isOpen: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  alternateLabel?: string
  confirmVariant?: 'default' | 'danger'
  alternateVariant?: 'default' | 'danger'
  closeOnOverlay?: boolean
  closeOnEscape?: boolean
  onConfirm: () => void
  onCancel: () => void
  onAlternate?: () => void
}

export const ConfirmDialog = ({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel,
  alternateLabel,
  confirmVariant = 'default',
  alternateVariant = 'default',
  closeOnOverlay = true,
  closeOnEscape = true,
  onConfirm,
  onCancel,
  onAlternate,
}: ConfirmDialogProps) => {
  const { t } = useI18n()

  const resolvedConfirmLabel = confirmLabel ?? t('confirm.default')
  const resolvedCancelLabel = cancelLabel ?? t('confirm.cancel')

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (closeOnEscape && event.key === 'Escape') {
        onCancel()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [closeOnEscape, isOpen, onCancel])

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="confirm-dialog-overlay"
      onClick={() => {
        if (closeOnOverlay) {
          onCancel()
        }
      }}
      role="presentation"
    >
      <div
        className={[
          'confirm-dialog',
          alternateLabel && onAlternate ? 'confirm-dialog-wide' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <h3>{title}</h3>
        {description ? <p className="muted">{description}</p> : null}

        <div className="confirm-dialog-actions">
          <button type="button" className="secondary" onClick={onCancel}>
            {resolvedCancelLabel}
          </button>
          {alternateLabel && onAlternate ? (
            <button
              type="button"
              className={alternateVariant === 'danger' ? 'danger' : undefined}
              onClick={onAlternate}
            >
              {alternateLabel}
            </button>
          ) : null}
          <button
            type="button"
            className={confirmVariant === 'danger' ? 'danger' : undefined}
            onClick={onConfirm}
          >
            {resolvedConfirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
