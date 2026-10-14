import React from 'react';
import cx from 'classnames';
import { Info } from 'lucide-react';
import { ToolTip } from '@/_components/ToolTip';
import { getLimitState } from '@/modules/common/helpers/limitGating';
import useUpgradeAction from '@/modules/common/hooks/useUpgradeAction';

/**
 * "ⓘ 1/2 · Upgrade" shown in a create form whenever the plan limits that resource.
 * Hovering the count explains it. Renders nothing when the plan is unlimited.
 *
 * @param {object} limit limit payload: { current, total, canAddUnlimited }
 * @param {string} unit singular name used in the tooltip, e.g. "workflow"
 */
export default function LimitCounter({ limit, unit, className }) {
  const { canUpgrade, upgrade } = useUpgradeAction();
  const { limited, current, total } = getLimitState(limit);
  if (!limited) return null;

  const message = `You've used ${current} of your ${total} ${unit} limit on this plan`;

  return (
    <div
      data-cy="limit-counter"
      className={cx('tw-flex tw-items-center tw-gap-1 tw-font-body-default tw-text-text-placeholder', className)}
    >
      <ToolTip message={message} placement="bottom">
        <span className="tw-inline-flex tw-items-center tw-gap-1" tabIndex={0} aria-label={message}>
          <Info size={14} aria-hidden="true" />
          {current}/{total}
        </span>
      </ToolTip>
      {canUpgrade && (
        <>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            onClick={upgrade}
            data-cy="limit-counter-upgrade"
            className="tw-p-0 tw-border-0 tw-bg-transparent tw-font-body-default tw-text-text-brand hover:tw-underline"
          >
            Upgrade
          </button>
        </>
      )}
    </div>
  );
}
