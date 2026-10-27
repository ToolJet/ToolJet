import React, { useEffect, useState } from 'react';
import cx from 'classnames';
import CloseIcon from '@/_ui/Icon/bulkIcons/CloseIcon';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { migrationsService } from '@/_services/migrations.service';
import { authenticationService } from '@/_services/authentication.service';
import { getSubpath } from '@/_helpers/routes';

const DISMISS_KEY = 'migration-banner-dismissed';
const POLL_MS = 30000;
const RUNNING_POLL_MS = 3000;

const MESSAGES = {
  running: 'ToolJet is being upgraded. Some features may not work and changes may not save until it finishes.',
  failed: 'The latest ToolJet upgrade failed. Changes cannot be saved until an administrator fixes it.',
};

const SUPER_ADMIN_FAILED_MESSAGE = 'The latest ToolJet upgrade failed. Changes cannot be saved. See what failed';

// status.readsBlocked: an upgrade from an old release, where the server refuses everything but sign-in.
const UNAVAILABLE_MESSAGES = {
  running: 'ToolJet is being upgraded and is unavailable until it finishes.',
  failed: 'The latest ToolJet upgrade failed. ToolJet is unavailable until an administrator fixes it.',
};

const SUPER_ADMIN_UNAVAILABLE_MESSAGE = 'The latest ToolJet upgrade failed. ToolJet is unavailable. See what failed';

// Released and embedded apps: end users see neither the product name nor admin steps.
// MIGRATION_END_USER_MESSAGE_RUNNING / _FAILED override these (sent as status.endUserMessage).
const END_USER_MESSAGES = {
  running: 'Scheduled maintenance in progress. Some changes may not save until it finishes.',
  failed: 'Maintenance is taking longer than expected. Some changes may not save right now.',
};

const END_USER_UNAVAILABLE_MESSAGES = {
  running: 'Scheduled maintenance in progress. This app is unavailable until it finishes.',
  failed: 'Maintenance is taking longer than expected. This app is unavailable right now.',
};

const readDismissed = () => {
  try {
    return sessionStorage.getItem(DISMISS_KEY);
  } catch {
    return null;
  }
};

const writeDismissed = (value) => {
  try {
    sessionStorage.setItem(DISMISS_KEY, value);
  } catch {
    // storage blocked; dismissal lasts until rerender only
  }
};

/** floating: a fixed pill for full-height screens (editor, released and embedded apps) that must not shift layout. */
export const MigrationBanner = ({ darkMode, onVisibilityChange, floating = false, endUser = false }) => {
  const [status, setStatus] = useState({ state: 'idle' });
  const [dismissed, setDismissed] = useState(readDismissed);
  const [superAdmin, setSuperAdmin] = useState(false);

  useEffect(() => {
    const subscription = authenticationService.currentSession.subscribe((session) =>
      setSuperAdmin(!!session?.super_admin)
    );
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let timer;
    let cancelled = false;
    const poll = async () => {
      const next = await migrationsService.getStatus();
      if (cancelled) return;
      setStatus(next);
      timer = setTimeout(poll, next.state === 'running' ? RUNNING_POLL_MS : POLL_MS);
    };
    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  const linkToMigrations = superAdmin && status.state === 'failed';
  const unavailable = !!status.readsBlocked;
  const message = linkToMigrations
    ? unavailable
      ? SUPER_ADMIN_UNAVAILABLE_MESSAGE
      : SUPER_ADMIN_FAILED_MESSAGE
    : endUser
      ? status.endUserMessage || (unavailable ? END_USER_UNAVAILABLE_MESSAGES : END_USER_MESSAGES)[status.state]
      : (unavailable ? UNAVAILABLE_MESSAGES : MESSAGES)[status.state];
  // Per run and state: a new run, or the same run failing, shows again after a dismissal.
  const runKey = `${status.state}:${status.startedAt ?? ''}`;
  const visible = !!message && dismissed !== runKey;

  useEffect(() => {
    onVisibilityChange?.(visible);
  }, [visible, onVisibilityChange]);

  // Always mounted, so screen readers announce the message when it appears rather than missing a pre-filled region.
  const announcement = (
    <div role="status" className="tw-sr-only">
      {visible ? message : ''}
    </div>
  );
  if (!visible) return announcement;

  const close = () => {
    writeDismissed(runKey);
    setDismissed(runKey);
  };

  return (
    <>
      {announcement}
      <div
        data-cy="migration-banner"
        className={cx(
          'tw-flex tw-items-center tw-justify-center tw-gap-2 tw-px-4 tw-bg-background-warning-weak',
          floating
            ? 'tw-fixed tw-bottom-4 tw-left-1/2 tw-z-[1040] tw-max-w-[min(760px,calc(100vw-32px))] tw--translate-x-1/2 tw-rounded-full tw-border tw-border-solid tw-border-border-weak tw-py-1.5'
            : 'tw-h-[30px] tw-w-full',
          { 'theme-dark dark-theme': darkMode }
        )}
      >
        <div className="tw-ml-auto tw-flex tw-min-w-0 tw-items-center tw-gap-2">
          <SolidIcon name="warning" width="16" fill="var(--icon-warning)" className="tw-shrink-0" />
          {linkToMigrations ? (
            <a
              href={`${getSubpath() ?? ''}/settings/migrations`}
              title={message}
              className="tw-truncate tw-font-body-small tw-text-text-warning tw-underline hover:tw-text-text-warning"
            >
              {message}
            </a>
          ) : (
            <p title={message} className="tw-m-0 tw-truncate tw-font-body-small tw-text-text-warning">
              {message}
            </p>
          )}
        </div>
        <button
          type="button"
          aria-label="Dismiss upgrade notice"
          onClick={close}
          className="tw-ml-auto tw-flex tw-shrink-0 tw-items-center tw-rounded tw-border-0 tw-bg-transparent tw-p-1 tw-cursor-pointer hover:tw-bg-interactive-hover focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-border-accent-strong"
        >
          <CloseIcon width="12" />
        </button>
      </div>
    </>
  );
};

export default MigrationBanner;
