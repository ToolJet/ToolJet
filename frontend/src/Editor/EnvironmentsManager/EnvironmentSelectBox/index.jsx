import React, { useState, useRef, useEffect } from 'react';
import { capitalize } from 'lodash';
import XenvSvg from '@assets/images/icons/x-env.svg';
import '@/_styles/versions.scss';

function EnvironmentSelectBox(props) {
  const { options, currentEnv } = props;
  const [showOptions, setShowOptions] = useState(false);
  const ref = useRef(null);

  const handleClickOutside = (event) => {
    if (ref.current && !ref.current.contains(event.target)) {
      setShowOptions(false);
      event.stopPropagation();
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  });

  const handleClick = (option) => {
    if (option.haveVersions) {
      setShowOptions(false);
      option.onClick();
    }
  };

  if (!currentEnv) {
    return null;
  }

  const darkMode = darkMode ?? (localStorage.getItem('darkMode') === 'true' || false);

  return (
    <div
      className={`env-container ${showOptions ? 'selected' : ''} ${darkMode ? 'theme-dark' : ''}`}
      ref={ref}
      data-cy="env-container"
    >
      <div className={`d-inline-flex align-items-center env-header`} onClick={() => setShowOptions(!showOptions)}>
        <XenvSvg />
        <div data-cy="list-current-env-name">{capitalize(currentEnv.name)}</div>
        <div className={`env-arrow ${showOptions ? 'env-arrow-roate' : ''} `}>
          <svg
            width="12"
            height="12"
            viewBox="0 0 6 10"
            fill={darkMode ? 'ffffff' : '#cccccc'}
            xmlns="http://www.w3.org/2000/svg"
            data-cy="env-arrow"
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M0.942841 0.344988C0.673302 0.560619 0.629601 0.953927 0.845232 1.22347L3.86622 4.9997L0.845232 8.77593C0.629601 9.04547 0.673301 9.43878 0.94284 9.65441C1.21238 9.87004 1.60569 9.82634 1.82132 9.5568L5.15465 5.39013C5.33726 5.16187 5.33726 4.83753 5.15465 4.60926L1.82132 0.442596C1.60569 0.173058 1.21238 0.129357 0.942841 0.344988Z"
              fill={darkMode ? 'ffffff' : '#cccccc'}
            />
          </svg>
        </div>
      </div>
      {showOptions && (
        <div className={`env-popover ${darkMode ? 'theme-dark' : ''}`}>
          <div className="selected-env" data-cy="selected-current-env-name">
            {' '}
            {capitalize(currentEnv.name)}
          </div>
          <div className={`popover-options ${darkMode ? 'dark-theme' : ''}`}>
            {options.map((option, index) => {
              return (
                <div
                  key={index}
                  onClick={() => handleClick(option)}
                  className={`${darkMode ? 'dark-theme' : ''}`}
                  data-cy="env-name-list"
                >
                  {option.label}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default EnvironmentSelectBox;
