import React from 'react';
import { ArrowLeft, PenLine, TriangleAlert } from 'lucide-react';

import { Button } from '@/components/ui/Button/Button';
import { cn } from '@/lib/utils';
import DropdownMenu, { type DropdownMenuSection } from '@/components/ui/Rocket/DropdownMenu';
import Tooltip from '@/components/ui/Rocket/Tooltip';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';
import { TestConnection } from '@/modules/dataSources/components/DataSourceManager/TestConnection';
import type { DataSourcePageHeaderContext } from '@/modules/dataSources/components/DataSourceManager/DataSourceManager';

interface BranchStoreState {
  isInitialized: boolean;
  orgGitConfig?: { is_branching_enabled?: boolean; isBranchingEnabled?: boolean } | null;
  currentBranch?: { is_default?: boolean; isDefault?: boolean } | null;
}

interface DataSourceDetailHeaderProps {
  context: DataSourcePageHeaderContext;
  onBack: () => void;
  /** Receives the element that hosts the form's own save/connect buttons (OAuth, SharePoint). */
  onActionsSlotChange: (slot: HTMLElement | null) => void;
}

const HELPER_TEXT = 'Only the base URL is required to save.';

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

// Data sources are global settings: on a feature branch they follow the PR flow instead of being version controlled.
function useIsGlobalSettingOnFeatureBranch() {
  return useWorkspaceBranchesStore((state: BranchStoreState) => {
    if (!state.isInitialized || !state.orgGitConfig) return false;
    const isBranchingEnabled = state.orgGitConfig.is_branching_enabled || state.orgGitConfig.isBranchingEnabled;
    const isDefault = state.currentBranch?.is_default || state.currentBranch?.isDefault;
    return Boolean(isBranchingEnabled && !isDefault);
  });
}

export default function DataSourceDetailHeader({ context, onBack, onActionsSlotChange }: DataSourceDetailHeaderProps) {
  const {
    icon,
    name,
    isDummy,
    dummyMessage,
    isNameDisabled,
    onNameChange,
    docLink,
    environments,
    currentEnvironment,
    onEnvironmentChange,
    testConnectionProps,
    onSave,
    isSaving,
    isSaveDisabled,
  } = context;
  const isFeatureBranch = useIsGlobalSettingOnFeatureBranch();

  const environmentSections: DropdownMenuSection[] = [
    {
      id: 'environments',
      type: 'radio',
      value: currentEnvironment?.id ?? '',
      onValueChange: (id) => {
        const environment = environments.find((env) => env.id === id);
        if (environment) onEnvironmentChange(environment);
      },
      items: environments.map((env) => ({
        value: env.id,
        label: capitalize(env.name),
        disabled: env.enabled === false,
        'data-cy': `${env.name}-label`,
      })),
    },
  ];

  return (
    <header className="tw-flex tw-h-[7.5rem] tw-shrink-0 tw-items-center tw-justify-between tw-gap-4 tw-border-0 tw-border-b tw-border-solid tw-border-border-weak tw-pl-11 tw-pr-20">
      <div className="tw-flex tw-min-w-0 tw-items-start tw-gap-4">
        {/* Bare 20px icon in the design; still a button for keyboard access. */}
        <button
          type="button"
          aria-label="Back to data sources"
          data-cy="button-back-ds-connection-modal"
          onClick={onBack}
          className="tw-mt-2 tw-flex tw-size-5 tw-shrink-0 tw-cursor-pointer tw-items-center tw-justify-center tw-border-0 tw-bg-transparent tw-p-0 tw-text-icon-default hover:tw-text-icon-strong"
        >
          <ArrowLeft size={20} aria-hidden />
        </button>
        <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-2.5">
          <span className="tw-flex tw-size-[54px] tw-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-border-weak tw-bg-page-weak [&>*]:tw-size-9">
            {icon}
          </span>
          <div className="tw-min-w-0">
            <div className="tw-flex tw-items-center tw-gap-2.5">
              {/* Plain text by default. The box (hover, focus) starts at the icon tile's gap and pads the text inward, as in the design; growing it leftwards would overlap the tile. */}
              <label
                className={cn(
                  '-tw-ml-px -tw-my-[5px] tw-flex tw-min-w-0 tw-items-center tw-gap-2.5 tw-rounded-lg tw-border tw-border-solid tw-border-transparent tw-px-0 tw-py-1',
                  !isNameDisabled &&
                    'tw-cursor-text hover:tw-ml-0 hover:tw-border-border-default hover:tw-px-3 focus-within:tw-ml-0 focus-within:tw-px-3 focus-within:tw-min-w-80 focus-within:tw-border-border-accent-strong focus-within:tw-shadow-[0_0_0_1px_var(--border-accent-strong)] focus-within:hover:tw-border-border-accent-strong'
                )}
              >
                <input
                  type="text"
                  value={name}
                  onChange={(event) => onNameChange(event.target.value)}
                  disabled={isNameDisabled}
                  aria-label="Data source name"
                  autoComplete="off"
                  data-cy="data-source-name-input-field"
                  style={{ width: `${Math.max(name.length, 1)}ch` }}
                  className="tw-m-0 tw-h-[35px] tw-min-w-[3ch] tw-max-w-full tw-truncate tw-rounded-none tw-border-0 tw-bg-transparent tw-p-0 tw-font-inter tw-text-[1.375rem] tw-font-medium tw-leading-relaxed tw-tracking-[var(--letter-spacing-display-medium)] tw-text-text-default tw-shadow-none tw-outline-0 tw-ring-0 focus:tw-bg-transparent focus:tw-shadow-none focus:tw-ring-0 disabled:tw-bg-transparent disabled:tw-opacity-100"
                />
                {!isNameDisabled && (
                  <PenLine size={16} aria-hidden className="tw-ml-auto tw-shrink-0 tw-text-icon-default" />
                )}
              </label>
              {isFeatureBranch && !isDummy && (
                <Tooltip
                  arrow
                  content="This is a global setting which follows the same PR flow but are not version controlled, they apply across all versions once merged."
                >
                  <span className="tw-flex tw-items-center" data-cy="global-setting-branch-warning">
                    <TriangleAlert size={14} className="tw-text-[var(--icon-warning)]" />
                  </span>
                </Tooltip>
              )}
              {isDummy && (
                <Tooltip arrow content={dummyMessage}>
                  <span className="tw-flex tw-items-center" data-cy="dummy-ds-header-warning-icon">
                    <TriangleAlert size={14} className="tw-text-[var(--icon-warning)]" />
                  </span>
                </Tooltip>
              )}
            </div>
            {/* TODO(pending): same copy for every data source until per-source text exists. See PENDING.md. */}
            <p className="tw-m-0 tw-mt-0.5 tw-font-body-default tw-text-text-placeholder">
              {HELPER_TEXT}{' '}
              <a
                className="tw-text-text-accent tw-underline hover:tw-text-text-accent"
                href={docLink}
                target="_blank"
                rel="noreferrer"
                data-cy="link-read-documentation"
              >
                Read the setup guide.
              </a>
            </p>
          </div>
        </div>
      </div>

      <div className="tw-flex tw-shrink-0 tw-items-center tw-gap-2.5">
        {environments.length > 1 && (
          <DropdownMenu
            align="end"
            trigger={
              <Button isLucid variant="secondary" trailingIcon="chevron-down" data-cy="environment-select">
                {capitalize(currentEnvironment?.name ?? '')}
              </Button>
            }
            sections={environmentSections}
          />
        )}
        {testConnectionProps && (
          <TestConnection
            {...testConnectionProps}
            renderTrigger={({ onClick, isTesting }: { onClick: () => void; isTesting: boolean }) => (
              <Button
                isLucid
                variant="secondary"
                leadingIcon="arrow-up-down"
                disabled={isTesting}
                onClick={onClick}
                data-cy="test-connection-button"
              >
                {isTesting ? 'Testing connection...' : 'Test connection'}
              </Button>
            )}
          />
        )}
        <div ref={onActionsSlotChange} className="tw-flex tw-items-center tw-gap-2.5 empty:tw-hidden" />
        {onSave && (
          <Button
            isLucid
            variant="secondary"
            leadingIcon="save"
            isLoading={isSaving}
            disabled={isSaveDisabled}
            onClick={onSave}
            data-cy="db-connection-save-button"
          >
            Save
          </Button>
        )}
      </div>
    </header>
  );
}
