import React from 'react';
import cx from 'classnames';
import { shallow } from 'zustand/shallow';
import { LockKeyhole, TriangleAlert } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  Button,
} from '@/components/ui/Rocket';
import { useLicenseStore } from '@/_stores/licenseStore';
import { getLimitState } from '@/modules/common/helpers/limitGating';
import useUpgradeAction from '@/modules/common/hooks/useUpgradeAction';

// Copy from the Figma "Limit" section, per resource.
const LIMIT_COPY = {
  apps: { title: 'App limit reached', noun: 'applications' },
  workflows: { title: 'Workflow limit reached', noun: 'workflows' },
  workspaces: { title: 'Workspace limit reached', noun: 'workspaces' },
  tables: { title: 'Database limit reached', noun: 'tables and/or rows' },
  users: { title: 'User limit reached', noun: 'builders and/or end-users' },
};

/**
 * Shown instead of a create form when a plan limit is reached. Mounted once in App.jsx and
 * opened through useLicenseStore's openLimitReached():
 * - one limit: { resource, limit }, e.g. apps (10/10)
 * - several: { resource, limits: [{ label, limit }] }, e.g. users (Builders 2/2, End-users 50/50)
 */
export default function LimitReachedModal() {
  const { limitReached, closeLimitReached } = useLicenseStore(
    (state) => ({ limitReached: state.limitReached, closeLimitReached: state.actions.closeLimitReached }),
    shallow
  );
  const { canUpgrade, upgrade } = useUpgradeAction();

  const copy = LIMIT_COPY[limitReached.resource];
  if (!copy) return null;

  const darkMode = localStorage.getItem('darkMode') === 'true';
  const rows = limitReached.limits ?? [];
  const { current, total } = getLimitState(limitReached.limit);
  const reason = rows.length
    ? `You've reached your limit for ${copy.noun}.`
    : `You've reached your limit for ${copy.noun} (${current}/${total}).`;
  const nextStep = canUpgrade
    ? 'Upgrade your plan to continue building.'
    : 'Ask your admin to upgrade your plan to continue building.';

  const handleUpgrade = () => {
    closeLimitReached();
    upgrade();
  };

  return (
    <AlertDialog open={limitReached.open} onOpenChange={(isOpen) => !isOpen && closeLimitReached()}>
      <AlertDialogContent
        preventClose={false}
        className={cx({ 'dark-theme theme-dark': darkMode })}
        data-cy="limit-reached-modal"
      >
        <AlertDialogHeader>
          <AlertDialogMedia className="tw-justify-start">
            <TriangleAlert className="tw-size-10 tw-text-icon-danger" aria-hidden="true" />
          </AlertDialogMedia>
          <AlertDialogTitle>{copy.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {reason} {nextStep}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {rows.length > 0 && (
          <dl className="tw-m-0 tw-pt-3 tw-flex tw-flex-col tw-gap-1 tw-border-0 tw-border-t tw-border-solid tw-border-border-weak">
            {rows.map(({ label, limit }) => {
              const state = getLimitState(limit);
              if (!state.limited) return null;
              return (
                <div
                  key={label}
                  className={cx(
                    'tw-flex tw-justify-between tw-font-body-default',
                    state.reached ? 'tw-text-text-danger' : 'tw-text-text-placeholder'
                  )}
                >
                  <dt className="tw-font-normal">{label}</dt>
                  <dd className="tw-m-0">
                    {state.current}/{state.total}
                  </dd>
                </div>
              );
            })}
          </dl>
        )}
        <AlertDialogFooter>
          <Button variant="outline" onClick={closeLimitReached} data-cy="limit-reached-not-now">
            Not now
          </Button>
          {canUpgrade && (
            <Button
              danger
              leadingVisual={<LockKeyhole className="tw-size-4" aria-hidden="true" />}
              onClick={handleUpgrade}
              data-cy="limit-reached-upgrade"
            >
              Upgrade
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
