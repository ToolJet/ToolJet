import React from 'react';
import AlertDialog from '@/_ui/AlertDialog';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export default function ErrorDetailModal({ notification, show, onClose }) {
  const { t } = useTranslation();
  const [showTrace, setShowTrace] = React.useState(false);
  const meta = notification?.metadata || {};
  const stack = meta?.error?.stack;

  const copyTrace = () => {
    navigator.clipboard?.writeText(stack || '');
    toast.success(t('notifications.copied', 'Copied'));
  };

  // P2: deep-link to git-sync modal (action is app-builder-scoped)

  return (
    <AlertDialog
      show={show}
      closeModal={onClose}
      title={notification?.title}
      size="lg"
      customClassName="notification-error-modal"
    >
      <div className="notification-error-body">
        <p className="notification-error-message">{notification?.body}</p>
        <div className="notification-error-meta">
          {meta.action && <span>action: {meta.action}</span>}
          {meta.branchName && <span> · {meta.branchName}</span>}
        </div>
        {stack && (
          <div className="notification-error-trace">
            <button className="btn btn-sm btn-link" onClick={() => setShowTrace((v) => !v)}>
              {showTrace ? '▾' : '▸'} {t('notifications.technicalDetails', 'Technical details')}
            </button>
            {showTrace && (
              <div className="trace-wrap">
                <button className="btn btn-sm copy-btn" onClick={copyTrace}>
                  {t('notifications.copy', 'Copy')}
                </button>
                <pre className="notification-error-pre">{stack}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </AlertDialog>
  );
}
