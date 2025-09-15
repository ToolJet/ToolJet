import React, { useMemo, useState, useRef, useEffect } from 'react';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import cx from 'classnames';
import './styles.scss';

export const DataDropdown = (props) => {
  const { value, onChange, forceCodeBox: _forceCodeBox } = props;

  // Simple emoji/text icons instead of lucide icons
  const sourceOptions = useMemo(
    () => [
      { id: 'rawJson', label: 'Raw JSON', icon: <SolidIcon width="16px" name="curlybraces" /> },
      { id: 'query', label: 'Query', icon: <SolidIcon width="16px" name="datasource" /> },
    ],
    []
  );

  const getSelectedSource = (v) => {
    if (!v) return null;
    return sourceOptions.find((option) => option.id === v) || null;
  };

  const [isOpen, setIsOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState(() => getSelectedSource(value));
  const dropdownRef = useRef(null);

  // Handle outside clicks
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const selectSource = (source) => {
    setSelectedSource(source);
    setIsOpen(false);
    onChange(source.id);
  };

  const renderCheckIcon = ({ id }) => {
    if (value === id) {
      return <SolidIcon name="check" width="16" height="16" fill="#4368E3" viewBox="0 0 16 16" />;
    } else {
      return <div style={{ width: '16px', height: '16px' }}></div>;
    }
  };

  return (
    <div className="tw-w-full tw-max-w-md dropdown-menu-inspector" ref={dropdownRef}>
      <div className="tw-relative">
        {/* Dropdown trigger div */}
        <button
          onClick={toggleDropdown}
          className={cx(
            'tw-flex tw-items-center tw-justify-between tw-w-full tw-px-4 tw-py-2 tw-text-left tw-bg-white dropdown-menu-trigger',
            {
              'is-open': isOpen,
            }
          )}
        >
          <div className="tw-flex tw-items-center">
            {selectedSource ? (
              <>
                <span className="tw-mr-2">{selectedSource.icon}</span>
                <span>{selectedSource.label}</span>
              </>
            ) : (
              <>
                <span className="tw-mr-2 tw-text-gray-400">
                  <SolidIcon name="code" width="16" height="16" fill="#CCD1D5" />
                </span>
                <span className="tw-text-gray-400 dropdown-menu-placeholder">Select a source</span>
              </>
            )}
          </div>
          <span className="tw-ml-2">
            {isOpen ? (
              <SolidIcon name="TriangleDownCenter" width={16} />
            ) : (
              <SolidIcon name="TriangleUpCenter" width={16} />
            )}
          </span>
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="tw-absolute tw-z-10 tw-w-full tw-mt-1 tw-rounded-md tw-shadow-lg tw-p-2 dropdown-menu-container">
            <div className="tw-py-1 dropdown-menu-items">
              {sourceOptions.map((option) => (
                <div
                  key={option.id}
                  onClick={() => selectSource(option)}
                  className="tw-flex tw-items-center tw-w-full tw-px-4 tw-py-2 tw-text-left dropdown-menu-item"
                >
                  {renderCheckIcon(option)}
                  <span className="icon-image">{option.icon}</span>
                  <span>{option.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
