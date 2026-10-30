import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';

export default function DependencyWarningDialog({ open, title, message, darkMode, onClose }) {
  const dialogRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement;
    const dialog = dialogRef.current;
    const focusable = () => [
      ...dialog.querySelectorAll(
        'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]'
      ),
    ];
    const focusInside = () => (focusable()[0] || dialog).focus();
    focusInside();
    const containFocus = (event) => {
      if (!dialog.contains(event.target)) focusInside();
    };
    const handleKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        closeRef.current();
      } else if (event.key === 'Tab') {
        const targets = focusable();
        const first = targets[0] || dialog;
        const last = targets[targets.length - 1] || dialog;
        if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('focusin', containFocus);
    document.addEventListener('keydown', handleKey, true);
    return () => {
      document.removeEventListener('focusin', containFocus);
      document.removeEventListener('keydown', handleKey, true);
      if (opener?.isConnected) opener.focus();
    };
  }, [open]);
  if (!open) return null;
  return ReactDOM.createPortal(
    <div
      className={darkMode ? 'dark-theme' : ''}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          width: 360,
          background: 'var(--background-surface-layer-01)',
          borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ padding: '20px 24px 0' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: '50%',
              backgroundColor: 'var(--background-error-weak)',
            }}
          >
            <SolidIcon name="warning" width="24" fill="var(--icon-danger)" />
          </div>
        </div>
        <div style={{ padding: '16px 24px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-default)', margin: 0 }}>{title}</h3>
          <p style={{ fontSize: 14, color: 'var(--text-medium)', lineHeight: 1.6, margin: 0 }}>{message}</p>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            padding: '16px 24px',
            borderTop: '1px solid var(--border-default)',
          }}
        >
          <ButtonSolid variant="tertiary" onClick={onClose} data-cy="dependent-apps-acknowledge-button">
            I understand
          </ButtonSolid>
        </div>
      </div>
    </div>,
    document.body
  );
}
