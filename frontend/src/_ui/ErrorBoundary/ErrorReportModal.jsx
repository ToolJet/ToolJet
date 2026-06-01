import React, { useMemo } from 'react';
import ModalBase from '@/_ui/Modal';
import { copyToClipboard } from '@/_helpers/appUtils';
import { buildErrorReport } from './errorReport';
import './FallbackBoundary.scss';

// User-triggered modal that surfaces a copy-pasteable error report.
// Opened only when the user clicks "Report error" on a boundary fallback,
// so it never auto-interrupts and never stacks across multiple boundaries.
const ErrorReportModal = ({ show, onClose, error, errorInfo, eventId, label, darkMode }) => {
  const report = useMemo(
    () => buildErrorReport({ error, errorInfo, label, eventId }),
    [error, errorInfo, label, eventId]
  );
  const message = error?.message || String(error || 'Unknown error');

  return (
    <ModalBase
      show={show}
      handleClose={onClose}
      darkMode={darkMode}
      title="Report this error"
      size="lg"
      confirmBtnProps={{ title: 'Copy & report', variant: 'primary' }}
      handleConfirm={() => copyToClipboard(report)}
    >
      <div className="tj-error-report">
        <p className="tj-error-report__hint tj-text-sm">
          Something went wrong in <strong>{label || 'this area'}</strong>. Copy the details below and share them with
          the ToolJet team so we can fix it.
        </p>
        <div className="tj-error-report__message tj-text-sm" data-cy="error-report-message">
          {message}
        </div>
        <pre className="tj-error-report__details" data-cy="error-report-details">
          {report}
        </pre>
      </div>
    </ModalBase>
  );
};

export default ErrorReportModal;
