import React from 'react';
import * as Sentry from '@sentry/react';
import { withTranslation } from 'react-i18next';
import cx from 'classnames';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import ErrorReportModal from './ErrorReportModal';
import './FallbackBoundary.scss';

/**
 * Recoverable error boundary for AppBuilder UI units (panels, sections, query manager).
 *
 * - Isolates a failure to its own unit instead of blanking the editor.
 * - Surfaces a graceful inline fallback ("Something went wrong").
 * - Recovery: "Try again" re-mounts the unit; `resetKeys` auto-recovers when the
 *   selected entity changes (e.g. switching component / query / page).
 * - "Report error" opens a modal with a copy-pasteable report (user-triggered, never auto).
 *
 * Props:
 *   label      — human name of the unit, e.g. "Query manager", "Inspector · Columns".
 *   variant    — 'panel' (default, fills container) | 'inline' (compact one-liner).
 *   resetKeys  — array; when any value changes, the boundary auto-resets.
 *   darkMode   — theme flag for the fallback + modal.
 */
class FallbackBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, eventId: null, showReport: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    const { label } = this.props;
    // Sentry holds the de-minified stack (prod uses hidden-source-map). Keep the
    // returned event id so support can pull the symbolicated trace from the report.
    const eventId = Sentry.captureException(error, {
      tags: { errorBoundary: label || 'app-builder' },
      extra: { area: label, componentStack: errorInfo?.componentStack },
    });
    this.setState({ error, errorInfo, eventId });
    // eslint-disable-next-line no-console
    console.error(`[ErrorBoundary${label ? ` · ${label}` : ''}]`, error, errorInfo);
  }

  componentDidUpdate(prevProps) {
    // Auto-recover when the entity that caused the crash is no longer selected.
    if (this.state.hasError && this.didResetKeysChange(prevProps.resetKeys, this.props.resetKeys)) {
      this.reset();
    }
  }

  didResetKeysChange(prev = [], next = []) {
    if (prev.length !== next.length) return true;
    return prev.some((key, i) => !Object.is(key, next[i]));
  }

  reset = () => this.setState({ hasError: false, error: null, errorInfo: null, showReport: false });

  openReport = () => this.setState({ showReport: true });

  closeReport = () => this.setState({ showReport: false });

  render() {
    const { hasError, error, errorInfo, eventId, showReport } = this.state;
    const { children, variant = 'panel', label, darkMode, t } = this.props;

    if (!hasError) return children;

    const title = t ? t('errorBoundary', 'Something went wrong.') : 'Something went wrong.';

    return (
      <>
        <div
          className={cx('tj-error-boundary', `tj-error-boundary--${variant}`, { 'theme-dark dark-theme': darkMode })}
          data-cy="error-boundary-fallback"
        >
          <SolidIcon name="warning" width="20" className="tj-error-boundary__icon" />
          <div className="tj-error-boundary__title" data-cy="error-boundary-title">
            {title}
          </div>
          {variant !== 'inline' && (
            <div className="tj-error-boundary__subtitle">
              {label ? `The ${label.toLowerCase()} couldn't be loaded.` : "This section couldn't be loaded."}
            </div>
          )}
          <div className="tj-error-boundary__actions">
            <ButtonSolid variant="tertiary" size="sm" onClick={this.reset} data-cy="error-boundary-retry">
              Try again
            </ButtonSolid>
            <ButtonSolid variant="ghostBlue" size="sm" onClick={this.openReport} data-cy="error-boundary-report">
              Report error
            </ButtonSolid>
          </div>
        </div>
        {showReport && (
          <ErrorReportModal
            show={showReport}
            onClose={this.closeReport}
            error={error}
            errorInfo={errorInfo}
            eventId={eventId}
            label={label}
            darkMode={darkMode}
          />
        )}
      </>
    );
  }
}

export default withTranslation()(FallbackBoundary);
