import React, { useMemo, useState, useRef, useEffect } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import DataSourceIcon from '@/AppBuilder/QueryManager/Components/DataSourceIcon';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import cx from 'classnames';
import Fuse from 'fuse.js';
import './styles.scss';
import AddQueryBtn from './AddQueryBtn';
import InputComponent from '@/components/ui/Input/Index';
import useShowPopover from '@/_hooks/useShowPopover';

export const DropdownMenu = (props) => {
  const { value, onChange, darkMode } = props;

  const dataQueries = useStore((state) => state.dataQuery.queries.modules.canvas, shallow);
  const [searchValue, setSearchValue] = useState('');
  const [filteredQueries, setFilteredQueries] = useState(dataQueries);
  const [showMenu, setShowMenu] = useShowPopover(
    false,
    '#component-data-query-add-popover',
    '#component-data-query-add-popover-btn'
  );

  // Simple emoji/text icons instead of lucide icons
  const sourceOptions = useMemo(() => {
    const options = props.meta.options;
    return options.map((option) => ({
      id: option.value,
      label: option.name,
      icon: <SolidIcon name="curlybraces" />,
    }));
  }, [props.meta.options]);

  const queryOptions = useMemo(() => {
    return filteredQueries.map((query) => ({
      id: query.id,
      value: `{{queries.${query.id}.data}}`,
      label: query.name,
      icon: <DataSourceIcon source={query} height={16} />,
      type: 'query',
    }));
  }, [filteredQueries]);

  const closeMenu = () => {
    if (!showMenu) {
      return;
    }
    setShowMenu(false);
  };

  const filterQueries = (value, queries) => {
    if (value) {
      const fuse = new Fuse(queries, { keys: ['name'], shouldSort: true, threshold: 0.3 });
      const results = fuse.search(value);
      let filterDataQueries = [];
      results.every((result) => {
        if (result.item.name === value) {
          filterDataQueries = [];
          filterDataQueries.push(result.item);
          return false;
        }
        filterDataQueries.push(result.item);
        return true;
      });
      setFilteredQueries(filterDataQueries);
    } else {
      setFilteredQueries(queries);
    }
  };

  const getSelectedSource = (value) => {
    if (!value) return null;
    const selectedItem = sourceOptions.find((option) => option.id === value);
    if (selectedItem) {
      return selectedItem;
    }
    if (typeof value !== 'string' || !value.startsWith('{{queries.')) {
      return null;
    }
    const queryName = value.split('.')[1]?.replace('}}', '');
    const selectedQuery = queryOptions.find((option) => option.label === queryName);
    if (selectedQuery) {
      return selectedQuery;
    }
    return null;
  };

  const handleChange = (data) => {
    const { id, name, kind } = data;
    const option = {
      id: id,
      label: name,
      value: `{{queries.${id}.data}}`,
      icon: <DataSourceIcon source={{ id, name, kind }} height={16} />,
      type: 'query',
    };
    setSelectedSource(option);
    onChange(`{{queries.${id}.data}}`);
  };

  const [isOpen, setIsOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState(() => getSelectedSource(value));
  const dropdownRef = useRef(null);

  // Initialize filtered queries when dataQueries change
  useEffect(() => {
    setFilteredQueries(dataQueries);
  }, [dataQueries]);

  // Filter queries when search value changes
  useEffect(() => {
    filterQueries(searchValue, dataQueries);
  }, [searchValue, dataQueries]);

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
    if (source.id === 'rawJson' || source.id === 'jsonSchema') {
      onChange(source.id);
    } else if (source.type === 'query') {
      onChange(source.value);
    }
  };

  const renderCheckIcon = (props) => {
    let transformedValue = props.value;
    const { id, label } = props;
    if (typeof transformedValue === 'string' && transformedValue.startsWith('{{queries.')) {
      transformedValue = transformedValue.replace(id, label);
    }
    if (value === props.id || value === transformedValue) {
      return <SolidIcon name="check" width="16" height="16" fill="#4368E3" viewBox="0 0 18 18" />;
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
          <div className="dropdown-menu-trigger-content">
            {selectedSource ? (
              <>
                <span className="tw-mr-2">{selectedSource.icon}</span>
                <span className="dropdown-menu-trigger-label">{selectedSource.label}</span>
              </>
            ) : (
              <>
                <span className="tw-mr-2 tw-text-gray-400">
                  <SolidIcon name="code" width="16" height="16" fill="#CCD1D5" />
                </span>
                <span className="tw-text-gray-400 dropdown-menu-placeholder dropdown-menu-trigger-label">
                  Select a source
                </span>
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
          <div className="tw-absolute tw-z-10 tw-w-full tw-mt-1 tw-rounded-md dropdown-menu-container">
            <div className="dropdown-menu-header">
              <InputComponent
                leadingIcon="search01"
                onChange={(e) => setSearchValue(e.target.value)}
                onClear={() => setSearchValue('')}
                size="medium"
                placeholder="Search for queries"
                value={searchValue}
                {...(searchValue && { trailingAction: 'clear' })}
              />
            </div>
            {dataQueries.length > 0 && (
              <>
                {/* Query options section */}
                <div className="dropdown-menu-items dropdown-menu-body dropdown-menu-body-transparent-scrollbar">
                  {queryOptions.map((option) => (
                    <div
                      key={option.id}
                      onClick={() => selectSource(option)}
                      className="tw-flex tw-items-center tw-w-full tw-text-left dropdown-menu-item"
                      onMouseEnter={() => closeMenu()}
                    >
                      {renderCheckIcon(option)}
                      <span className="icon-image">{option.icon}</span>
                      <span className="dropdown-menu-item-label">{option.label}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
            {/* Source options section */}
            <div className="dropdown-menu-items dropdown-menu-footer">
              {sourceOptions.map((option) => (
                <div
                  key={option.id}
                  onClick={() => selectSource(option)}
                  className="tw-flex tw-items-center tw-w-full tw-text-left dropdown-menu-item"
                  onMouseEnter={() => closeMenu()}
                >
                  {renderCheckIcon(option)}
                  <span className="icon-image">{option.icon}</span>
                  <span className="dropdown-menu-item-label">{option.label}</span>
                </div>
              ))}
              <AddQueryBtn
                onQueryCreate={handleChange}
                darkMode={darkMode}
                showMenu={showMenu}
                setShowMenu={setShowMenu}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
