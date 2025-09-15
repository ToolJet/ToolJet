import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import DataSourceIcon from '@/AppBuilder/QueryManager/Components/DataSourceIcon';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { SearchBox } from '@/_components/SearchBox';
import Plus from '@/_ui/Icon/solidIcons/Plus';
import useShowPopover from '@/_hooks/useShowPopover';
import DataSourceSelect from '@/AppBuilder/QueryManager/Components/DataSourceSelect';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import Fuse from 'fuse.js';
import '../DataDropdown/styles.scss';

export const QueryDropdown = (props) => {
  const { value, onChange, className, disabled = false, placeholder = 'Select a query', _forceCodeBox } = props;

  const dataQueries = useStore((state) => state.dataQuery.queries.modules.canvas, shallow);

  const queryOptions = useMemo(() => {
    return dataQueries.map((query) => ({
      id: query.id,
      value: `{{queries.${query.id}.data}}`,
      label: query.name,
      icon: <DataSourceIcon source={query} height={16} />,
      type: 'query',
    }));
  }, [dataQueries]);

  const getSelectedQuery = useCallback(
    (value) => {
      if (!value) return null;
      let queryId = value;
      if (value.startsWith('{{queries.')) {
        const parts = value.split('.');
        if (parts.length >= 2) {
          queryId = parts[1];
        }
      }
      return queryOptions.find((option) => option.id === queryId) || null;
    },
    [queryOptions]
  );

  const [isOpen, setIsOpen] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [filteredOptions, setFilteredOptions] = useState(queryOptions);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const searchBoxRef = useRef(null);

  const [showAddQueryMenu, setShowAddQueryMenu] = useShowPopover(
    false,
    '#query-add-ds-popover',
    '#query-add-ds-popover-btn'
  );
  const selectRef = useRef();

  useEffect(() => {
    setSelectedQuery(getSelectedQuery(value));
  }, [value, getSelectedQuery]);

  useEffect(() => {
    if (searchTerm) {
      const fuse = new Fuse(queryOptions, { keys: ['label'], shouldSort: true, threshold: 0.3 });
      const results = fuse.search(searchTerm);
      let filterDataQueries = [];
      results.every((result) => {
        if (result.item.label === searchTerm) {
          filterDataQueries = [];
          filterDataQueries.push(result.item);
          return false;
        }
        filterDataQueries.push(result.item);
        return true;
      });
      setFilteredOptions(filterDataQueries);
    } else {
      setFilteredOptions(queryOptions);
    }
  }, [searchTerm, queryOptions]);

  useEffect(() => {
    if (isOpen) {
      searchBoxRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (showAddQueryMenu) {
      selectRef.current?.focus();
    }
  }, [showAddQueryMenu]);

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

  const selectQuery = (query) => {
    setSelectedQuery(query);
    setIsOpen(false);
    onChange(query.value);
  };

  const renderCheckIcon = ({ id }) => {
    let currentQueryId = value;
    if (value?.startsWith('{{queries.')) {
      const parts = value.split('.');
      if (parts.length >= 2) {
        currentQueryId = parts[1];
      }
    }
    if (currentQueryId === id) {
      return <SolidIcon name="check" width="16" height="16" fill="#4368E3" viewBox="0 0 16 16" />;
    } else {
      return <div style={{ width: '16px', height: '16px' }}></div>;
    }
  };

  return (
    <div className={cx('tw-w-full tw-max-w-md dropdown-menu-inspector', className)} ref={dropdownRef}>
      <div className="tw-relative">
        {/* Dropdown trigger div */}
        <button
          onClick={toggleDropdown}
          disabled={disabled}
          className={cx(
            'tw-flex tw-items-center tw-justify-between tw-w-full tw-px-4 tw-py-2 tw-text-left tw-bg-white dropdown-menu-trigger',
            {
              'is-open': isOpen,
              'tw-bg-neutral-100 tw-text-neutral-400 tw-cursor-not-allowed': disabled,
            }
          )}
        >
          <div className="tw-flex tw-items-center">
            {selectedQuery ? (
              <>
                <span className="tw-mr-2">{selectedQuery.icon}</span>
                <span>{selectedQuery.label}</span>
              </>
            ) : (
              <>
                <span className="tw-mr-2 tw-text-gray-400">
                  <SolidIcon name="query" width="16" height="16" fill="#CCD1D5" />
                </span>
                <span className="tw-text-gray-400 dropdown-menu-placeholder">{placeholder}</span>
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
        {isOpen && !disabled && (
          <div className="tw-absolute tw-z-10 tw-w-full tw-mt-1 tw-rounded-md tw-shadow-lg tw-p-2 dropdown-menu-container">
            {/* Search Box - Always Visible */}
            <div className="tw-mb-2">
              <SearchBox
                ref={searchBoxRef}
                width="100%"
                initialValue={searchTerm}
                callBack={(val) => {
                  setSearchTerm(val.target.value);
                }}
                onClearCallback={() => setSearchTerm('')}
                placeholder="Search for queries"
                showClearButton
                clearTextOnBlur={false}
              />
            </div>

            {/* Query List */}
            <div className="tw-py-1 dropdown-menu-items">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <div
                    key={option.id}
                    onClick={() => selectQuery(option)}
                    className="tw-flex tw-items-center tw-w-full tw-px-4 tw-py-2 tw-text-left dropdown-menu-item"
                  >
                    {renderCheckIcon(option)}
                    <span className="icon-image">{option.icon}</span>
                    <span>{option.label}</span>
                  </div>
                ))
              ) : (
                <div className="tw-px-4 tw-py-2 tw-text-gray-500 tw-text-sm">
                  {searchTerm ? 'No queries match your search' : 'No queries available'}
                </div>
              )}
            </div>

            {/* Add New Query Button */}
            <div className="tw-border-t tw-pt-2 tw-mt-2">
              <OverlayTrigger
                show={showAddQueryMenu && !disabled}
                placement="left-start"
                overlay={
                  <Popover id="query-add-ds-popover" style={{ width: '244px', maxWidth: '246px' }}>
                    <DataSourceSelect selectRef={selectRef} closePopup={() => setShowAddQueryMenu(false)} />
                  </Popover>
                }
              >
                <div id="query-add-ds-popover-btn">
                  <button
                    className="tw-flex tw-items-center tw-w-full tw-px-4 tw-py-2 tw-text-left tw-text-gray-600 hover:tw-bg-gray-50 tw-rounded"
                    disabled={disabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (disabled) return;
                      setShowAddQueryMenu(!showAddQueryMenu);
                    }}
                  >
                    <Plus style={{ height: '14px', marginRight: '8px' }} fill="var(--icons-default)" />
                    Add new query
                  </button>
                </div>
              </OverlayTrigger>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

QueryDropdown.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  forceCodeBox: PropTypes.func,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  placeholder: PropTypes.string,
};

export default QueryDropdown;
