import React from 'react';
import { toast } from 'react-hot-toast';
import { TriangleAlert, Copy, X } from 'lucide-react';
import AlertDialog from '@/_ui/AlertDialog';
import { timeAgo } from './NotificationRow';

// Figma 70:6766: header = triangle-alert + title + ×; lead line + relative time;
// trace shown by default; footer = primary "Copy trace" button.
// AlertDialog's title prop is string-only (data-cy slugify) — render our own header.
export default function ErrorDetailModal({ notification, show, onClose }) {
  const meta = notification?.metadata || {};
  const stack = meta?.error?.stack;

  const copyTrace = () => {
    navigator.clipboard?.writeText(stack || '');
    toast.success('Copied to clipboard');
  };

  // P2: deep-link to git-sync modal (action is app-builder-scoped)

  return (
    <AlertDialog show={show} closeModal={onClose} size="lg" customClassName="notification-error-modal">
      <div className="notification-error-body">
        <div className="notification-error-header">
          <span className="notification-error-title">
            <TriangleAlert size={18} color="#D72D39" />
            {notification?.title}
          </span>
          <button className="notification-error-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="notification-error-lead">
          <span className="notification-error-message">{notification?.body}</span>
          <span className="notification-error-time">{timeAgo(notification?.createdAt)}</span>
        </div>
        {stack && <pre className="notification-error-pre">{stack}</pre>}
        {stack && (
          <div className="notification-error-footer">
            <button className="notification-copy-trace" onClick={copyTrace}>
              <Copy size={14} />
              Copy trace
            </button>
          </div>
        )}
      </div>
    </AlertDialog>
  );
}
