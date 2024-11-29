import './styles.scss';
import React, { useContext, useEffect, useState } from 'react';
import Select from '@/_ui/Select';
import { TooljetDatabaseContext } from '../index';
import { operators } from '../constants';
import { debounce } from 'lodash';
import { ToolTip } from '@/_components';
import SolidIcon from '@/_ui/Icon/SolidIcons';

export const FilterForm = ({ filters, setFilters, index, column = '', operator = '', value = '', generateMessage }) => {
  const { columns, setPageCount } = useContext(TooljetDatabaseContext);

  const [filterInputValue, setFilterInputValue] = useState(value);

  useEffect(() => {
    const debouncedFilter = debounce(() => {
      const prevFilters = { ...filters };
      prevFilters[index].value = filterInputValue;

      setFilters(prevFilters);
    }, 500);

    debouncedFilter();

    return debouncedFilter.cancel;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterInputValue]);

  useEffect(() => {
    setFilterInputValue(value);
  }, [value]);

  const handleColumnChange = (value) => {
    const prevFilters = { ...filters };
    prevFilters[index].column = value;

    setFilters(prevFilters);
  };

  const handleOperatorChange = (value) => {
    const prevFilters = { ...filters };
    prevFilters[index].operator = value;

    setFilters(prevFilters);
  };

  const handleDelete = () => {
    const prevFilters = { ...filters };
    delete prevFilters[index];
    setFilters(prevFilters);
    setPageCount(1);
  };

  const handleSelectOpen = () => {
    document.body.classList.add('react-select-open');
    const selectControl = document.querySelector('.select-operation-field .react-select__control');
    if (selectControl) {
      const rect = selectControl.getBoundingClientRect();
      document.documentElement.style.setProperty('--select-width', `${rect.width}px`);
      document.documentElement.style.setProperty('0', `${rect.left}px`);
      document.documentElement.style.setProperty('100%', `${rect.bottom + window.scrollY}px`);
    }
  };

  const handleSelectClose = () => {
    document.body.classList.remove('react-select-open');
  };

  const displayColumns = columns.map(({ accessor }) => ({ value: accessor, label: accessor }));

  return (
    <div className="row g-0 d-flex align-items-center justify-content-center tw-w-[525px]">
      <div className="col-11">
        <div className="row g-0 align-items-center">
          <div className="col-4 select-column-field width-lg" data-cy="select-column-field">
            <Select
              useMenuPortal={false}
              placeholder="Select.."
              value={column}
              options={displayColumns}
              onChange={handleColumnChange}
              width="100%"
              borderRadius="8px 0px 0px 8px"
              onMenuOpen={handleSelectOpen}
              onMenuClose={handleSelectClose}
            />
          </div>
          <ToolTip
            message={generateMessage(operator)}
            trigger={['hover']}
            delay={{ show: '0', hide: '0' }}
            show={['gt', 'lte', 'gte'].includes(operator)}
          >
            <div className="col-4 select-operation-field width-sm" data-cy="select-operation-field">
              <Select
                placeholder="Select.."
                useMenuPortal={false}
                value={operator}
                options={operators}
                onChange={handleOperatorChange}
                width="100%"
                borderRadius="0px"
                onMenuOpen={handleSelectOpen}
                onMenuClose={handleSelectClose}
              />
            </div>
          </ToolTip>
          <div className="col-4">
            <input
              value={filterInputValue}
              className="form-control css-zz6spl-container input-element"
              data-cy="value-input-field"
              placeholder="Enter value"
              onChange={(event) => {
                setFilterInputValue(event.target.value);
              }}
            />
          </div>
        </div>
      </div>
      <div className="col-1 delete-icon-wrapper" data-cy="delete-icon" onClick={handleDelete}>
        <SolidIcon name="trash" fill="#E54D2E" width="14" />
      </div>
    </div>
  );
};
