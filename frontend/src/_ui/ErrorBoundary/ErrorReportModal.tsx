import React, { useMemo } from 'react';
import ModalBaseRaw from '@/_ui/Modal';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { copyToClipboard } from '@/_helpers/appUtils';
import { buildErrorReport } from './errorReport';
import './FallbackBoundary.scss';

// Community Slack (redirects to the live invite) — where users report the copied error.
// const REPORT_URL = 'https://tooljet.com/slack';

// ModalBase is an untyped JS component; relax its props to avoid spurious type errors.
const ModalBase = ModalBaseRaw as React.FC<any>;

interface ErrorReportModalProps {
  show: boolean;
  onClose: () => void;
  error?: (Error & { message?: string }) | null;
  errorInfo?: React.ErrorInfo | null;
  eventId?: string | null;
  label?: string;
  darkMode?: boolean;
}

// User-triggered modal that surfaces a copy-pasteable error report.
// Opened only when the user clicks "Report error" on a boundary fallback,
// so it never auto-interrupts and never stacks across multiple boundaries.
const ErrorReportModal: React.FC<ErrorReportModalProps> = ({
  show,
  onClose,
  error,
  errorInfo,
  eventId,
  label,
  darkMode,
}) => {
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
      showHeader={false}
      size="lg"
      footerBody={
        <div className="tj-error-report__footer">
          <ButtonSolid variant="tertiary" onClick={onClose} data-cy="cancel-button">
            Cancel
          </ButtonSolid>
          <ButtonSolid variant="primary" onClick={() => copyToClipboard(report)} data-cy="error-report-copy">
            Copy
          </ButtonSolid>
        </div>
      }
    >
      <div className="tj-error-report">
        <div className="tj-error-report__heading">
          <SolidIcon
            name="warning"
            width="40"
            fill="var(--icon-danger, #d72d39)"
            className="tj-error-report__heading-icon"
          />
          <div className="tj-error-report__heading-text">
            <div className="tj-error-report__title" data-cy="error-report-modal-title">
              Something went wrong in {label || 'this area'}
            </div>
            <div className="tj-error-report__subtitle tj-text-sm">
              Copy the details below so our team can help fix it.
            </div>
          </div>
        </div>
        <div className="tj-error-report__callout" data-cy="error-report-callout">
          <div className="tj-error-report__callout-content">
            <div className="tj-error-report__callout-message tj-text-sm" data-cy="error-report-message">
              {message}
            </div>
          </div>
        </div>
        <pre className="tj-error-report__details" data-cy="error-report-details">
          {report}
        </pre>
      </div>
    </ModalBase>
  );
};

export default ErrorReportModal;
