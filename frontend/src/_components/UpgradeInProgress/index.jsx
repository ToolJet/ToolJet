import React, { useEffect, useState } from 'react';
import { migrationsService } from '@/_services/migrations.service';
import { getSubpath } from '@/_helpers/routes';

const POLL_MS = 3000;

// A page that fails to load during an upgrade lands on the error route; while the upgrade runs, show its
// progress instead, and go back to the app once it ends. Plain on purpose: released apps reach it too.
export const UpgradeInProgress = ({ children }) => {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let timer;
    let sawRunning = false;
    const poll = async () => {
      const next = await migrationsService.getStatus();
      if (cancelled) return;
      if (next.state === 'running') {
        sawRunning = true;
        timer = setTimeout(poll, POLL_MS);
      } else if (sawRunning) {
        window.location.assign(`${getSubpath() ?? ''}/`);
        return;
      }
      setStatus(next);
    };
    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  if (!status) return null;
  if (status.state !== 'running') return children;

  const { done, total } = status.progress ?? {};
  const percent = total ? Math.round((done / total) * 100) : 0;

  return (
    <main className="tw-fixed tw-inset-0 tw-z-[1100] tw-flex tw-items-center tw-justify-center tw-bg-background-surface-layer-01 tw-p-4">
      <div className="tw-flex tw-w-full tw-max-w-md tw-flex-col tw-gap-3" role="status" aria-live="polite">
        <h1 className="tw-m-0 tw-font-title-large tw-text-text-default">Scheduled maintenance in progress</h1>
        <p className="tw-m-0 tw-font-body-default tw-text-text-placeholder">This page will be available again soon.</p>
        <div
          role="progressbar"
          aria-label="Maintenance progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="tw-h-2 tw-w-full tw-overflow-hidden tw-rounded-full tw-bg-background-surface-layer-02"
        >
          <div
            className="tw-h-full tw-bg-background-accent-strong tw-transition-[width] tw-duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="tw-m-0 tw-font-body-small tw-text-text-placeholder">
          {total ? `${done} of ${total} done (${percent}%)` : `${percent}%`}
        </p>
      </div>
    </main>
  );
};
