import React from 'react';
import * as Sentry from '@sentry/react';
import { withTranslation, WithTranslation } from 'react-i18next';
import cx from 'classnames';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import ErrorReportModal from './ErrorReportModal';
import { getErrorContext } from './errorReport';
import './FallbackBoundary.scss';

interface FallbackBoundaryProps extends Partial<WithTranslation> {
  children?: React.ReactNode;
  /** Human name of the unit, e.g. "Query manager", "Inspector · Columns". */
  label?: string;
  /** 'panel' (default, fills container) | 'inline' (compact one-liner). */
  variant?: 'panel' | 'inline';
  /** When any value changes, the boundary auto-resets. */
  resetKeys?: unknown[];
  /** Show a "Try again" button that re-mounts the unit. Only makes sense where a
   *  re-mount can recover (e.g. canvas widgets); panels recover via resetKeys. */
  canRetry?: boolean;
  /** Show the "Report error" button. Off for end-user surfaces (viewer) where the
   *  Slack report flow doesn't apply. */
  canReport?: boolean;
  /** Sentry `location` tag, e.g. "Component Button2" or "Properties Panel". Defaults to label. */
  location?: string;
  /** Sentry `source` tag. AppBuilder boundaries also get app/version/org context tags. */
  source?: string;
  /** Extra Sentry tags merged into the capture, e.g. { module: 'workflows' }. */
  tags?: Record<string, string>;
  darkMode?: boolean;
}

interface FallbackBoundaryState {
  hasError: boolean;
  error: (Error & { message?: string }) | null;
  errorInfo: React.ErrorInfo | null;
  eventId: string | null;
  showReport: boolean;
}

/**
 * Recoverable error boundary for AppBuilder UI units (panels, sections, query manager).
 *
 * - Isolates a failure to its own unit instead of blanking the editor.
 * - Surfaces a graceful inline fallback ("Something went wrong").
 * - Recovery: `resetKeys` auto-recovers when the selected entity changes (e.g.
 *   switching component / query / page); `canRetry` adds a "Try again" re-mount
 *   button where that makes sense (canvas widgets).
 * - "Report error" opens a modal with a copy-pasteable report (user-triggered, never auto).
 */
class FallbackBoundary extends React.Component<FallbackBoundaryProps, FallbackBoundaryState> {
  constructor(props: FallbackBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, eventId: null, showReport: false };
  }

  static getDerivedStateFromError(error: Error): Partial<FallbackBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    const { label, location, source = 'AppBuilder', tags } = this.props;
    // AppBuilder context (app/version/org/page) only makes sense for AppBuilder
    // boundaries — other sources pass their own context via `tags`.
    const isAppBuilder = source === 'AppBuilder';
    const ctx = isAppBuilder ? getErrorContext() : null;
    // Sentry holds the de-minified stack (prod uses hidden-source-map). Keep the
    // returned event id so support can pull the symbolicated trace from the report.
    // Tags are searchable filters (source/location/app/version/org); extra carries
    // the rest of the debugging context.
    const eventId = Sentry.captureException(error, {
      tags: {
        source,
        location: location || label || 'unknown',
        ...(ctx && {
          appId: ctx.appId || 'n/a',
          versionId: ctx.versionId || 'n/a',
          organizationId: ctx.organizationId || 'n/a',
        }),
        ...tags,
      },
      extra: {
        area: label,
        componentStack: errorInfo?.componentStack,
        ...(ctx && {
          appName: ctx.appName,
          pageId: ctx.pageId,
          environment: ctx.environment,
          mode: ctx.mode,
          tjVersion: ctx.tjVersion,
        }),
      },
    });
    this.setState({ error, errorInfo, eventId });
    // eslint-disable-next-line no-console
    console.error(`[ErrorBoundary${label ? ` · ${label}` : ''}]`, error, errorInfo);
  }

  componentDidUpdate(prevProps: FallbackBoundaryProps): void {
    // Auto-recover when the entity that caused the crash is no longer selected.
    if (this.state.hasError && this.didResetKeysChange(prevProps.resetKeys, this.props.resetKeys)) {
      this.reset();
    }
  }

  didResetKeysChange(prev: unknown[] = [], next: unknown[] = []): boolean {
    if (prev.length !== next.length) return true;
    return prev.some((key, i) => !Object.is(key, next[i]));
  }

  reset = (): void => this.setState({ hasError: false, error: null, errorInfo: null, showReport: false });

  openReport = (): void => this.setState({ showReport: true });

  closeReport = (): void => this.setState({ showReport: false });

  render(): React.ReactNode {
    const { hasError, error, errorInfo, eventId, showReport } = this.state;
    const { children, variant = 'panel', label, canRetry = false, canReport = true, darkMode, t } = this.props;

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
            {canRetry && (
              <ButtonSolid variant="tertiary" size="sm" onClick={this.reset} data-cy="error-boundary-retry">
                Try again
              </ButtonSolid>
            )}
            {canReport && (
              <ButtonSolid variant="secondary" size="sm" onClick={this.openReport} data-cy="error-boundary-report">
                Report error
              </ButtonSolid>
            )}
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
