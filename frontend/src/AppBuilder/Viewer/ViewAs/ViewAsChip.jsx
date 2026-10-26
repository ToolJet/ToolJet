import React from 'react';
import { UserRoundSearch, X } from 'lucide-react';
import useStore from '@/AppBuilder/_stores/store';
import { clearViewAs } from '@/AppBuilder/_helpers/viewAs';
import { useCanvasAppId } from './useCanvasAppId';

export default function ViewAsChip({ onApply }) {
  const appId = useCanvasAppId();
  const target = useStore((state) => state.viewAs?.target);

  if (!target) return null;

  const exit = () => {
    clearViewAs(appId);
    onApply();
  };

  return (
    <span
      className="preview-chip tw-ml-2 tw-inline-flex tw-max-w-[220px] tw-items-center tw-gap-1 tw-rounded-full tw-bg-background-accent-weak tw-py-0.5 tw-pl-2 tw-pr-1 tw-text-text-accent"
      data-cy="preview-view-as-chip"
    >
      <UserRoundSearch width={12} height={12} className="tw-shrink-0" />
      <span className="tw-truncate">{`Viewing as ${target.label}`}</span>
      <button
        type="button"
        className="tw-inline-flex tw-shrink-0 tw-items-center tw-rounded-full tw-border-0 tw-bg-transparent tw-p-0.5 tw-text-text-accent hover:tw-bg-interactive-hover"
        aria-label={`Stop viewing as ${target.label}`}
        title="Back to yourself"
        onClick={exit}
      >
        <X size={12} />
      </button>
    </span>
  );
}
