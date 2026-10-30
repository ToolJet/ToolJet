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
  onClose: () => void;
  appDetails: IAppDetails;
}

export default function ChangeIconDialog({ open, onClose, appDetails }: IChangeIconDialogProps) {
  const currentAppIcon = appDetails?.icon ?? '';

  const { mutate: changeAppIcon, isPending: isUpdatingAppIcon } = useChangeAppIcon();

  const [selectedIcon, setSelectedIcon] = useState(currentAppIcon);

  const handleSaveIconChanges = () => {
    if (!selectedIcon) {
      toast.error('Select an icon');
      return;
    }

    if (selectedIcon === appDetails?.icon) {
      toast.success('Icon updated.');
      onClose();
      return;
    }

    changeAppIcon(
      { appId: appDetails.id, icon: selectedIcon, appType: appDetails.type },
      {
        onSuccess: onClose,
      }
    );
  };

  const handleSelectIcon = (iconName) => () => setSelectedIcon(iconName);

  const isCancelBtnDisabled = isUpdatingAppIcon;
  const isSubmitBtnDisabled = true;
  // const isSubmitBtnDisabled = isUpdatingAppIcon || selectedIcon === currentAppIcon;
  const isFormBeingSubmitted = isUpdatingAppIcon;

  return (
    <ActionDialog
      title="Customize Icon"
      open={open}
      onClose={onClose}
      cancelBtnProps={{ 'data-cy': 'cancel-button', disabled: isCancelBtnDisabled, onClick: onClose }}
      submitActions={[
        {
          label: 'Save changes',
          disabled: isSubmitBtnDisabled,
          isLoading: isFormBeingSubmitted,
          'data-cy': 'save-changes',
          onClick: handleSaveIconChanges,
        },
      ]}
    >
      <ul className="tw-px-6 tw-py-4 tw-m-0 tw-list-none tw-grid tw-grid-cols-4 tw-place-items-center tw-gap-5">
        {NEW_ICONS.map(([iconName, LucideIcon]) => {
          return (
            <li
              role="button"
              tabIndex={0}
              key={iconName}
              onClick={handleSelectIcon(iconName)}
              className={cn(
                'tw-flex tw-items-center tw-justify-center tw-size-16 tw-border tw-border-solid tw-border-border-weak tw-rounded-sm tw-cursor-pointer hover:tw-bg-interactive-hover hover:tw-border-border-default',
                { 'tw-border-border-accent-strong hover:tw-border-border-accent-strong': selectedIcon === iconName }
              )}
            >
              <LucideIcon
                size={20}
                className={cn('tw-text-icon-strong', { 'tw-text-icon-brand': selectedIcon === iconName })}
              />
            </li>
          );
        })}
      </ul>
    </ActionDialog>
  );
}
