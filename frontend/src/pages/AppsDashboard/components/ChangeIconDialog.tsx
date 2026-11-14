import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

import { cn } from '@/lib/utils';
import { ICONS_BY_LEGACY_NAME } from '@/pages/AppsDashboard/components/AppIcon';
import { useChangeAppIcon } from '@/_services/hooks/appsServiceHooks';

import ActionDialog from './ActionDialog';

import type { IAppDetails } from '@/_stores/types/appsStore';

const NEW_ICONS = Object.entries(ICONS_BY_LEGACY_NAME);

interface IChangeIconDialogProps {
  open: boolean;
  appType: string;
  onClose: () => void;
  appDetails: IAppDetails;
}

type TIconName = keyof typeof ICONS_BY_LEGACY_NAME;

export default function ChangeIconDialog({ open, onClose, appType, appDetails }: IChangeIconDialogProps) {
  const currentAppIcon = appDetails?.icon ?? 'apps';

  const { mutate: changeAppIcon, isPending: isUpdatingAppIcon } = useChangeAppIcon();

  const [selectedIcon, setSelectedIcon] = useState<TIconName>(currentAppIcon);

  const handleSaveIconChanges = () => {
    if (!selectedIcon) {
      toast.error('Select an icon');
      return;
    }

    if (!appDetails?.id) return;

    if (selectedIcon === appDetails?.icon) {
      toast.success('Icon updated.');
      onClose();
      return;
    }

    changeAppIcon(
      { appId: appDetails.id, icon: selectedIcon, appType },
      {
        onSuccess: onClose,
      }
    );
  };

  const handleSelectIcon = (iconName: TIconName) => () => setSelectedIcon(iconName);

  const isCancelBtnDisabled = isUpdatingAppIcon;
  const isSubmitBtnDisabled = isUpdatingAppIcon;
  const isFormBeingSubmitted = isUpdatingAppIcon;

  return (
    <ActionDialog
      title="Customize Icon"
      open={open}
      cancelBtnProps={{ 'data-cy': 'cancel-button', disabled: isCancelBtnDisabled, onClick: onClose }}
      submitActions={[
        {
          label: 'Save changes',
          disabled: isSubmitBtnDisabled,
          isLoading: isFormBeingSubmitted,
          'data-cy': 'change-button',
          onClick: handleSaveIconChanges,
        },
      ]}
    >
      <ul className="tw-px-6 tw-py-4 tw-m-0 tw-list-none tw-grid tw-grid-cols-4 tw-place-items-center tw-gap-5">
        {NEW_ICONS.map(([iconName, LucideIcon]) => {
          return (
            <li key={iconName}>
              <button
                type="button"
                aria-label={iconName}
                aria-pressed={selectedIcon === iconName}
                data-cy={`${iconName}-icon`}
                onClick={handleSelectIcon(iconName)}
                className={cn(
                  'tw-flex tw-items-center tw-justify-center tw-size-16 tw-bg-transparent tw-border tw-border-solid tw-border-border-weak tw-rounded-sm tw-cursor-pointer hover:tw-bg-interactive-hover hover:tw-border-border-default',
                  { 'tw-border-border-accent-strong hover:tw-border-border-accent-strong': selectedIcon === iconName }
                )}
              >
                <LucideIcon
                  size={20}
                  className={cn('tw-text-icon-strong', { 'tw-text-icon-brand': selectedIcon === iconName })}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </ActionDialog>
  );
}
