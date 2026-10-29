import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toast, Toaster, ToastBar, useToasterStore } from 'react-hot-toast';
import './toast.scss';
import ErrorPanel from './ErrorPanel';
import { ChevronRight } from 'lucide-react';

const MAX_EXPANDED_ERRORS = 20;

// Keep custom/interactive content on its original path: hiding it could hide actions.
const textContent = (content) => {
  if (typeof content === 'string' || typeof content === 'number') return String(content);
  if (content == null || typeof content === 'boolean') return '';
  if (Array.isArray(content)) {
    const parts = content.map(textContent);
    return parts.includes(null) ? null : parts.join('');
  }
  if (
    React.isValidElement(content) &&
    ['div', 'span', 'p', 'strong', 'b', 'em', 'i', 'small', 'br'].includes(content.type) &&
    !Object.keys(content.props).some((key) => key.startsWith('on') || key === 'dangerouslySetInnerHTML')
  ) {
    return content.type === 'br' ? '\n' : textContent(content.props.children);
  }
  return null;
};

const StandardToast = ({ notification }) => (
  <ToastBar toast={notification}>
    {({ icon, message }) => (
      <>
        {icon}
        {message}
        <button
          className="btn-close"
          aria-label="Dismiss notification"
          onClick={() => toast.dismiss(notification.id)}
          data-cy="toast-close-button"
        />
      </>
    )}
  </ToastBar>
);

const GroupedToasts = ({ toastOptions }) => {
  const { toasts } = useToasterStore(toastOptions);
  const [panelErrors, setPanelErrors] = useState(null);
  const hidden = useRef(new Set());
  const groups = useMemo(() => {
    const groups = new Map();
    toasts.forEach((t) => {
      if (t.type !== 'error' || !t.visible || textContent(t.message) === null) return;
      const position = t.position || 'top-center';
      if (!groups.has(position)) groups.set(position, []);
      groups.get(position).push(t);
    });
    groups.forEach((errors) => errors.sort((a, b) => b.createdAt - a.createdAt));
    return groups;
  }, [toasts]);

  useEffect(() => {
    const currentIds = new Set(toasts.map((t) => t.id));
    for (const id of hidden.current) {
      if (!currentIds.has(id)) hidden.current.delete(id);
    }
    groups.forEach((errors) => {
      hidden.current.delete(errors[0].id);
      if (errors.length < 2) return;
      errors.slice(1).forEach((t) => hidden.current.add(t.id));
    });
  }, [toasts, groups]);

  useEffect(() => {
    if (!panelErrors) return;
    const anchor = toasts.find((t) => t.id === panelErrors.id);
    if (!anchor?.visible) {
      // Retain the snapshot only for the original exit animation.
      if (!anchor) setPanelErrors(null);
      return;
    }
    const active = groups.get(anchor.position || 'top-center') || [];
    // Store order is newest first; reverse before sorting to preserve arrival order on timestamp ties.
    const incoming = [...active]
      .reverse()
      .filter((t) => t.id !== anchor.id)
      .sort((a, b) => a.createdAt - b.createdAt);
    if (!incoming.length) return;
    const messages = new Map(panelErrors.errors.map((error) => [error.id, error]));
    incoming.forEach((t) => messages.set(t.id, { ...t, message: textContent(t.message) }));
    // Preserve the anchor, list DOM, scroll position and expansion animation state.
    setPanelErrors({ ...panelErrors, errors: [...messages.values()].slice(-MAX_EXPANDED_ERRORS) });
    // Absorbed errors are already hidden; free their store slots immediately.
    incoming.forEach((t) => {
      hidden.current.add(t.id);
      toast.remove(t.id);
    });
    // Keep the later deadline, expressed relative to the anchor and its accumulated hover pauses.
    toast.error(anchor.message, {
      ...anchor,
      duration: Math.max(
        anchor.duration,
        ...incoming.map((t) => t.createdAt + t.pauseDuration + t.duration - anchor.createdAt - anchor.pauseDuration)
      ),
    });
  }, [toasts, groups, panelErrors]);

  return (
    <>
      <Toaster toastOptions={toastOptions}>
        {(t) => {
          const position = t.position || 'top-center';
          const errors = groups.get(position) || [];
          if (panelErrors?.id === t.id) {
            return (
              <ToastBar
                toast={t}
                style={{
                  minWidth: panelErrors.initialSize.width,
                  minHeight: panelErrors.initialSize.height,
                  boxSizing: 'border-box',
                }}
              >
                {() => (
                  <ErrorPanel
                    errors={panelErrors.errors}
                    initialSize={panelErrors.initialSize}
                    onHeightChange={(height) => {
                      if (height !== t.height) toast.error(t.message, { ...t, height });
                    }}
                    onClose={() => toast.dismiss(t.id)}
                  />
                )}
              </ToastBar>
            );
          }
          const panelAnchor = panelErrors && toasts.find((item) => item.id === panelErrors.id);
          // Absorb arrivals before paint, rather than briefly rendering another toast.
          if (
            panelAnchor?.visible &&
            (panelAnchor.position || 'top-center') === position &&
            t.type === 'error' &&
            textContent(t.message) !== null
          )
            return null;
          const grouped = t.type === 'error' && errors.length > 1 && errors.some((error) => error.id === t.id);
          // Already-hidden members must not reappear during their exit/remove delay.
          if (t.type === 'error' && !t.visible && hidden.current.has(t.id)) return null;
          if (!grouped) return <StandardToast notification={t} />;
          // Empty wrappers measure zero, so hidden errors occupy neither height nor gutters.
          if (t.id !== errors[0].id) return null;
          const dismissErrors = () => {
            errors.forEach((error) => hidden.current.add(error.id));
            errors.forEach((error) => toast.dismiss(error.id));
          };
          return (
            <ToastBar toast={t}>
              {({ icon, message }) => (
                <div className="editor-error-toast">
                  <div className="editor-error-toast__summary">
                    <span className="editor-error-toast__label">Latest error</span>
                    <span className="editor-error-toast__count" role="status">
                      +{errors.length - 1} more {errors.length === 2 ? 'error' : 'errors'}
                    </span>
                    <button
                      className="editor-error-toast__action"
                      onClick={(event) => {
                        const card = event.currentTarget.closest('.editor-error-toast').parentElement;
                        const { width, height } = card.getBoundingClientRect();
                        setPanelErrors({
                          initialSize: { width, height },
                          id: t.id,
                          errors: [...errors]
                            .reverse()
                            .map((error) => ({ ...error, message: textContent(error.message) })),
                        });
                        // Keep the latest toast and its existing timer; absorb the older errors.
                        errors
                          .filter((error) => error.id !== t.id)
                          .forEach((error) => {
                            hidden.current.add(error.id);
                            toast.remove(error.id);
                          });
                      }}
                    >
                      View all
                      <ChevronRight size={14} aria-hidden="true" />
                    </button>
                  </div>
                  <div className="editor-error-toast__header">
                    {icon}
                    <div className="editor-error-toast__message">{message}</div>
                    <button
                      className="btn-close"
                      aria-label="Dismiss errors"
                      onClick={dismissErrors}
                      data-cy="toast-close-button"
                    />
                  </div>
                </div>
              )}
            </ToastBar>
          );
        }}
      </Toaster>
    </>
  );
};

// App surfaces opt into grouping; dashboard and auth notifications keep their original path.
const Toast = ({ groupErrors = false, ...props }) =>
  groupErrors ? (
    <GroupedToasts {...props} />
  ) : (
    <Toaster toastOptions={props.toastOptions}>{(t) => <StandardToast notification={t} />}</Toaster>
  );

export default Toast;
