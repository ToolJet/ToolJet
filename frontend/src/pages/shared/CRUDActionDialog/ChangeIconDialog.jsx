import React, { useRef, useState } from 'react';
import * as TablerIcons from '@tabler/icons-react';
import { toast } from 'react-hot-toast';
import { VirtuosoGrid } from 'react-virtuoso';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

import ActionDialog from '../ActionDialog';
import SearchBar, { useSearch } from '../SearchBar';
import { useChangeAppIcon } from '../hooks/appsServiceHooks';

export default function ChangeIconDialog({ open, onClose, appDetails }) {
  const { t } = useTranslation();

  const allIconsList = useRef(Object.keys(TablerIcons));
  const [selectedIcon, setSelectedIcon] = useState(appDetails?.icon ?? '');

  const { mutate: changeAppIcon, isPending: isUpdatingAppIcon } = useChangeAppIcon();
  const { searchTerm, setSearchTerm, debouncedSearchTerm } = useSearch({ debounceDelay: 300 });

  const handleSelectIcon = (iconName) => {
    setSelectedIcon(iconName);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleChangeIcon = () => {
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

  const isFormBeingSubmitted = isUpdatingAppIcon;
  const isCancelBtnDisabled = isFormBeingSubmitted;
  const isSubmitBtnDisabled = isFormBeingSubmitted;

  const filteredIcons =
    debouncedSearchTerm.trim() === ''
      ? allIconsList.current
      : allIconsList.current.filter((icon) => icon.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));

  return (
    <ActionDialog
      open={open}
      title={t('homePage.appCard.changeIcon', 'Change Icon')}
      cancelBtnProps={{ 'data-cy': 'cancel-button', disabled: isCancelBtnDisabled, onClick: onClose }}
      submitActions={[
        {
          label: t('homePage.change', 'Change'),
          disabled: isSubmitBtnDisabled,
          isLoading: isFormBeingSubmitted,
          'data-cy': 'submit-button',
          onClick: handleChangeIcon,
        },
      ]}
      classes={{
        dialogFooter: 'tw-border-t tw-border-border-weak',
      }}
    >
      <div>
        <SearchBar
          placeholder="Search icons"
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          classes={{ searchInputContainer: 'tw-mb-4' }}
        />

        {filteredIcons.length ? (
          <VirtuosoGrid
            style={{ height: 300, width: 328, scrollbarWidth: 'none' }}
            totalCount={filteredIcons.length - 1} // -1 to exclude createReactComponent
            listClassName="tw-grid tw-grid-cols-[repeat(10,1fr)] tw-gap-x-3 tw-gap-y-6"
            itemContent={(index) => {
              if (filteredIcons[index] === undefined || filteredIcons[index] === 'createReactComponent') return <></>;
              // eslint-disable-next-line import/namespace
              const IconElement = TablerIcons[filteredIcons[index]];

              return (
                <div role="button" onClick={() => handleSelectIcon(filteredIcons[index])}>
                  <IconElement
                    stroke={2}
                    size={20}
                    strokeLinejoin="miter"
                    className={cn('tw-text-icon-default', {
                      'tw-text-icon-brand': selectedIcon === filteredIcons[index],
                    })}
                  />
                </div>
              );
            }}
          />
        ) : (
          <div className="tw-flex tw-items-center tw-justify-center tw-h-[18.75rem] ">
            <p className="tw-text-body-large tw-text-text-placeholder">No matching results found</p>
          </div>
        )}
      </div>
    </ActionDialog>
  );
}
