import React, { useState, useRef, useEffect, useCallback } from 'react';
import { capitalize } from 'lodash';
import XenvSvg from '@assets/images/icons/x-env.svg';
import '@/_styles/versions.scss';
import { LicenseTooltip } from '@/LicenseTooltip';
import { Layers } from 'lucide-react';

const EnvironmentSelectBox = React.memo(function EnvironmentSelectBox({ options, currentEnv, licenseValid }) {
  const [showOptions, setShowOptions] = useState(false);
  const ref = useRef(null);

  const handleClickOutside = useCallback((event) => {
    if (ref.current && !ref.current.contains(event.target)) {
      setShowOptions(false);
      event.stopPropagation();
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  const handleClick = useCallback((option) => {
    if (option.haveVersions) {
      setShowOptions(false);
      option.onClick();
    }
  }, []);

  if (!currentEnv) return null;

  const darkMode = localStorage.getItem('darkMode') === 'true';

  const Wrapper = ({ children, option, licenseValid }) =>
    !option.enabled ? (
      <LicenseTooltip
        feature={'Multi-environments'}
        isAvailable={option.enabled}
        noTooltipIfValid={true}
        customMessage={
          !licenseValid
            ? 'Multi-environments are available only in paid plans'
            : 'Multi-environments are not included in your current plan'
        }
      >
        {children}
      </LicenseTooltip>
    ) : (
      <>{children}</>
    );

  const renderOption = ({ option, index }) => (
    <Wrapper key={index} option={option} licenseValid={licenseValid}>
      <div
        onClick={() => option.enabled && handleClick(option)}
        className={darkMode ? 'dark-theme' : ''}
        data-cy="env-name-list"
      >
        {option.label}
      </div>
    </Wrapper>
  );

  return (
    <div
      className={`env-container color-slate12 ${showOptions ? 'selected' : ''} ${darkMode ? 'dark-theme' : ''}`}
      ref={ref}
      data-cy="env-container"
    >
      <div className="d-inline-flex align-items-center env-header" onClick={() => setShowOptions(!showOptions)}>
        <Layers width="16" height="16" />
        <div data-cy="list-current-env-name">{capitalize(currentEnv.name)}</div>
      </div>
      {showOptions && (
        <div className={`env-popover ${darkMode ? 'theme-dark' : ''}`}>
          <div className="selected-env" data-cy="selected-current-env-name">
            {capitalize(currentEnv.name)}
          </div>
          <div className={`popover-options ${darkMode ? 'dark-theme' : ''}`}>
            {options.map((option, index) => renderOption({ option, index }))}
          </div>
        </div>
      )}
    </div>
  );
});

export default EnvironmentSelectBox;
