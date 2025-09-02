import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button/Button';
import { LicenseTooltip } from '@/LicenseTooltip';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { useTranslation } from 'react-i18next';

const CreateAppButtonBase = ({
  canCreateApp,
  appsLimit,
  featureType,
  disabled,
  isButtonLoading,
  loaderText,
  buttonText,
  dropdownItems,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { t: translate } = useTranslation();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  if (!canCreateApp) {
    return null;
  }

  const toggleDropdown = () => {
    if (!disabled) {
      setIsDropdownOpen(!isDropdownOpen);
    }
  };

  return (
    <div className="create-new-app-license-wrapper tw-px-4">
      <LicenseTooltip limits={appsLimit} feature={featureType} isAvailable={true} noTooltipIfValid={true}>
        <div className="tw-relative tw-w-full" ref={dropdownRef}>
          <Button
            variant="primary"
            size="default"
            disabled={disabled}
            className={`tw-w-full ${
              isDropdownOpen ? 'tw-bg-button-primary-pressed hover:tw-bg-button-primary-pressed' : ''
            }`}
            loaderText={loaderText}
            onClick={toggleDropdown}
          >
            {buttonText}
          </Button>

          {isDropdownOpen && (
            <div className="tw-absolute tw-top-9 tw-right-0 tw-mt-1 tw-bg-background-surface-layer-01 tw-border-0 tw-rounded-xl tw-shadow-elevation-200 tw-z-50 tw-min-w-[200px] tw-p-2 tw-w-full">
              {dropdownItems}
            </div>
          )}
        </div>
      </LicenseTooltip>
    </div>
  );
};

export default CreateAppButtonBase;
