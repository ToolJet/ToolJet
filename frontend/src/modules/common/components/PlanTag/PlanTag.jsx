import React from 'react';
import cx from 'classnames';
import { useInRouterContext } from 'react-router-dom';
import { LockKeyhole } from 'lucide-react';
import { ToolTip } from '@/_components/ToolTip';
import useFeatureGate from '@/modules/common/hooks/useFeatureGate';
import useUpgradeAction from '@/modules/common/hooks/useUpgradeAction';
import { fetchEdition } from '@/modules/common/helpers/utils';

const UPGRADE_LABEL = 'Upgrade';

// Tooltips open to the right of the tag and fall back to the top when there is no room.
const TOOLTIP_POPPER_CONFIG = {
  modifiers: [{ name: 'flip', enabled: true, options: { fallbackPlacements: ['top', 'bottom', 'left'] } }],
};

function getTooltipMessage({ tagLabel, requiredPlan, isHighestPlan, featureName, plural }) {
  const namesPlan = tagLabel === `${requiredPlan.label} plan`;
  const subject = featureName ?? 'This feature';
  const verb = plural ? 'are' : 'is';
  if (!namesPlan) return `Upgrade your plan to use ${featureName ?? 'this feature'}`;
  return isHighestPlan
    ? `${subject} ${verb} available only in ${tagLabel}`
    : `${subject} ${verb} available in ${tagLabel} and above`;
}

function PlanTagView({
  gateKey,
  isUnlocked,
  ceFallback = null,
  iconOnly = false,
  featureName,
  plural = false,
  className,
  onUpgrade,
}) {
  const { showTag, tagLabel, requiredPlan, isHighestPlan } = useFeatureGate(gateKey, { isUnlocked });

  if (fetchEdition() === 'ce') return ceFallback;
  if (!showTag) return null;

  // Only the "Upgrade" state (the workspace already has the plan this feature belongs to, or has none
  // we can compare against) goes anywhere; a plan name stays a plain label.
  const clickProps =
    onUpgrade && tagLabel === UPGRADE_LABEL
      ? {
          role: 'button',
          tabIndex: 0,
          onClick: onUpgrade,
          onKeyDown: (event) => (event.key === 'Enter' || event.key === ' ') && onUpgrade(),
        }
      : null;

  const tag = iconOnly ? (
    <span
      data-cy={`plan-tag-${gateKey}`}
      aria-label={getTooltipMessage({ tagLabel, requiredPlan, isHighestPlan, featureName, plural })}
      className={cx(
        'tw-inline-flex tw-items-center tw-shrink-0 tw-text-icon-warning',
        clickProps && 'tw-cursor-pointer',
        className
      )}
      {...clickProps}
    >
      <LockKeyhole size={12} aria-hidden="true" />
    </span>
  ) : (
    <span
      data-cy={`plan-tag-${gateKey}`}
      className={cx(
        'tw-inline-flex tw-items-center tw-gap-1 tw-h-5 tw-px-2 tw-shrink-0 tw-whitespace-nowrap tw-rounded-full',
        'tw-bg-background-warning-weak tw-font-title-small tw-text-text-warning',
        clickProps && 'tw-cursor-pointer hover:tw-underline',
        className
      )}
      {...clickProps}
    >
      <LockKeyhole size={12} aria-hidden="true" className="tw-text-icon-warning" />
      {tagLabel}
    </span>
  );

  // A lock on its own always explains itself; a labelled tag does when the call site names the feature.
  if (!iconOnly && !featureName) return tag;

  return (
    <ToolTip
      message={getTooltipMessage({ tagLabel, requiredPlan, isHighestPlan, featureName, plural })}
      placement="right"
      popperConfig={TOOLTIP_POPPER_CONFIG}
    >
      {tag}
    </ToolTip>
  );
}

function RoutedPlanTag(props) {
  const { canUpgrade, openLicensing } = useUpgradeAction();
  return <PlanTagView {...props} onUpgrade={canUpgrade ? openLicensing : undefined} />;
}

/**
 * Lock + plan name ("Team plan") on a gated feature. Renders nothing when the feature is available or
 * license data is still loading. A plan name is a plain label; the "Upgrade" state opens the licensing
 * page for people who can upgrade.
 *
 * @param {string} gateKey /license/access feature key (or 'byok')
 * @param {boolean} [isUnlocked] pass when the call site already knows availability
 * @param {React.ReactNode} [ceFallback] what CE shows instead (CE keeps its existing nudges)
 * @param {boolean} [iconOnly] lock icon with a hover tooltip, for tight spots such as tabs
 * @param {string} [featureName] feature name for the tooltip, e.g. "Modules". Needed for the icon-only
 *   variant; on a labelled tag it adds the same tooltip.
 * @param {boolean} [plural] use "are" instead of "is" in the tooltip ("Modules are available…")
 */
export default function PlanTag(props) {
  // Some trees (and tests) render without a router; the tag still works there, it just can't navigate.
  const inRouter = useInRouterContext();
  return inRouter ? <RoutedPlanTag {...props} /> : <PlanTagView {...props} />;
}
