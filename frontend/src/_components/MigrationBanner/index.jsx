import React, { useEffect, useState } from 'react';
import cx from 'classnames';
import CloseIcon from '@/_ui/Icon/bulkIcons/CloseIcon';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { migrationsService } from '@/_services/migrations.service';

const DISMISS_KEY = 'migration-banner-dismissed';
const POLL_MS = 30000;
const RUNNING_POLL_MS = 10000;

const MESSAGES = {
  running: 'ToolJet is being upgraded. Some features may not work and changes may not save until it finishes.',
  failed: 'The latest ToolJet upgrade failed. Some features may not work. Contact your administrator.',
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

export const MigrationBanner = ({ darkMode, onVisibilityChange }) => {
  const [status, setStatus] = useState({ state: 'idle' });
  const [dismissed, setDismissed] = useState(readDismissed);

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

  const message = MESSAGES[status.state];
  // A new run has a new startedAt, so an earlier dismissal no longer matches.
  const runKey = status.startedAt ?? status.state;
  const visible = !!message && dismissed !== runKey;

  useEffect(() => {
    onVisibilityChange?.(visible);
  }, [visible, onVisibilityChange]);

  if (!visible) return null;

  const close = () => {
    writeDismissed(runKey);
    setDismissed(runKey);
  };

  return (
    <div
      role="status"
      data-cy="migration-banner"
      className={cx(
        'tw-flex tw-h-[30px] tw-w-full tw-items-center tw-justify-center tw-gap-2 tw-px-4 tw-bg-background-warning-weak',
        { 'theme-dark dark-theme': darkMode }
      )}
    >
      <div className="tw-ml-auto tw-flex tw-items-center tw-gap-2">
        <SolidIcon name="warning" width="16" fill="var(--icon-warning)" />
        <p className="tw-m-0 tw-text-[12px] tw-leading-[18px] tw-text-text-warning">{message}</p>
      </div>
      <button
        type="button"
        aria-label="Dismiss upgrade notice"
        onClick={close}
        className="tw-ml-auto tw-flex tw-items-center tw-border-0 tw-bg-transparent tw-p-0 tw-cursor-pointer"
      >
        <CloseIcon width="12" />
      </button>
    </div>
  );
};

export default MigrationBanner;
