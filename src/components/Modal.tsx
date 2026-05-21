'use client'
import { useEffect, useCallback } from 'react'
import s from './Modal.module.css'

interface ModalProps {
  title: string
  onClose: () => void
  children: React.ReactNode
}

export default function Modal({ title, onClose, children }: ModalProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [handleKeyDown])

  return (
    <div className={s.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={s.modal} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className={s.header}>
          <h2 className={s.title} id="modal-title">{title}</h2>
          <button className={s.closeBtn} onClick={onClose} aria-label="Close modal">✕</button>
        </div>
        <div className={s.body}>{children}</div>
      </div>
    </div>
  )
}
