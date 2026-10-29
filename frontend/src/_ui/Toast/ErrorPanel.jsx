import React, { useLayoutEffect, useRef } from 'react';
import { ToastIcon } from 'react-hot-toast';

// Render within the latest ToastBar: its original timer owns the entire error list.
export default function ErrorPanel({ errors, onClose, initialSize, onHeightChange }) {
  const panelRef = useRef(null);
  const listRef = useRef(null);
  useLayoutEffect(() => {
    const card = panelRef.current?.parentElement;
    if (!card || typeof ResizeObserver === 'undefined') return;
    // react-hot-toast observes content mutations, not the animation's size changes.
    const observer = new ResizeObserver(() => onHeightChange(card.getBoundingClientRect().height));
    observer.observe(card);
    return () => observer.disconnect();
  }, [onHeightChange]);
  useLayoutEffect(() => {
    const list = listRef.current;
    list?.scrollTo?.({
      top: 0,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
  }, [errors]);
  useLayoutEffect(() => {
    const card = panelRef.current?.parentElement;
    if (!initialSize || !card?.animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const target = card.getBoundingClientRect();
    const animation = card.animate(
      [
        {
          width: `${initialSize.width}px`,
          height: `${initialSize.height}px`,
          boxSizing: 'border-box',
          overflow: 'hidden',
        },
        { width: `${target.width}px`, height: `${target.height}px`, boxSizing: 'border-box', overflow: 'hidden' },
      ],
      { duration: 240, easing: 'cubic-bezier(0.2, 0, 0, 1)' }
    );
    return () => animation.cancel();
  }, [initialSize]);

  return (
    <div className="toast-error-panel" ref={panelRef}>
      <div className="toast-error-panel__header">
        <span className="editor-error-toast__label">Errors ({errors.length})</span>
        <button className="btn-close" type="button" aria-label="Dismiss errors" onClick={onClose} />
      </div>
      <ol ref={listRef} className="toast-error-panel__list" tabIndex={0} aria-label="Error messages">
        {[...errors].reverse().map((error) => (
          <li key={error.id}>
            <div className="toast-error-panel__icon" aria-hidden="true">
              <ToastIcon toast={error} />
            </div>
            <span>{error.message || 'Something went wrong. Please try again.'}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
