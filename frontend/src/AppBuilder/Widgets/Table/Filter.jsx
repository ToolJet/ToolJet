import React, { useEffect } from 'react';
import Select from '@/_ui/Select';
import defaultStyles from '@/_ui/Select/styles';
import { useTranslation } from 'react-i18next';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import _, { isArray } from 'lodash';
// eslint-disable-next-line import/no-unresolved
import { diff as deepDiff } from 'deep-object-diff';

const FILTER_OPTIONS = [
  { name: 'contains', value: 'contains' },
  { name: 'does not contains', value: 'doesNotContains' },
  { name: 'matches', value: 'matches' },
  { name: 'does not match', value: 'nl' },
  { name: 'equals', value: 'equals' },
  { name: 'does not equal', value: 'ne' },
  { name: 'is empty', value: 'isEmpty' },
  { name: 'is not empty', value: 'isNotEmpty' },
  { name: 'greater than', value: 'gt' },
  { name: 'less than', value: 'lt' },
  { name: 'greater than or equals', value: 'gte' },
  { name: 'less than or equals', value: 'lte' },
];

export function Filter(props) {
  const { t } = useTranslation();

  const { mergeToFilterDetails, filterDetails, setAllFilters, fireEvent, darkMode, setExposedVariables } = props;
  const { filters } = filterDetails;

  const [activeFilters, set] = React.useState(filters);

  function filterColumnChanged(index, value) {
    const filter = props.columns.find((column) => column.value === value);
    const newFilters = filters.map((f, i) => {
      if (i === index) {
        return {
          ...f,
          id: filter.value,
          value: {
            ...f.value,
            column: filter.name,
          },
        };
      }
      return f;
    });
    mergeToFilterDetails({
      filters: newFilters,
    });
    setAllFilters(newFilters.filter((filter) => filter.id !== ''));
  }

  function filterOperationChanged(index, value) {
    const newFilters = filters;
    newFilters[index].value = {
      ...newFilters[index].value,
      condition: value,
    };

    //* if condition is "is empty" or "is not empty" then clear the filter query value
    if (value === 'isEmpty' || value === 'isNotEmpty') {
      newFilters[index].value.value = '';
    }
    mergeToFilterDetails({
      filters: newFilters,
    });
    setAllFilters(newFilters.filter((filter) => filter.id !== ''));
  }

  const debouncedFilterChanged = _.debounce((newFilters) => {
    setAllFilters(newFilters.filter((filter) => filter.id !== ''));
  }, 500);

  function filterValueChanged(index, value) {
    const newFilters = filters;
    newFilters[index].value = {
      ...newFilters[index].value,
      value: value,
    };
    mergeToFilterDetails({
      filters: newFilters,
    });
    debouncedFilterChanged(newFilters);
  }

  function addFilter() {
    mergeToFilterDetails({ filters: [...filters, { id: '', value: { condition: 'contains', value: '' } }] });
  }

  function removeFilter(index) {
    let newFilters = filters;
    newFilters.splice(index, 1);
    mergeToFilterDetails({
      filters: newFilters,
    });
    setAllFilters(newFilters.filter((filter) => filter.id !== ''));

    set(newFilters);
    setTimeout(() => fireEvent('onFilterChanged'), 0);
  }

  function clearFilters() {
    mergeToFilterDetails({
      filters: [],
    });
    setAllFilters([]);
    set([]);

    setTimeout(() => fireEvent('onFilterChanged'), 0);
  }

  useEffect(() => {
    if (filters.length > 0) {
      const tableFilters = JSON.parse(JSON.stringify(filters));
      const shouldFire = findFilterDiff(activeFilters, tableFilters);
      if (shouldFire) debounceFn();
      set(tableFilters);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    // Add CSA to set filters
    function setFilters(_filters) {
      if (!isArray(_filters)) return;
      const filterArr = [];
      _filters.forEach((_filter) => {
        const { column = '', value = '', condition = '' } = _filter;
        const columnId = props.columns.find((col) => col.name === column)?.value;
        const isCorrectCondition = FILTER_OPTIONS.some((option) => option.value === condition);
        if (columnId && isCorrectCondition) {
          const filterObj = {
            id: columnId,
            value: {
              column,
              condition,
              value,
            },
          };
          filterArr.push(filterObj);
        }
      });
      if (filterArr.length) {
        setAllFilters(filterArr.filter((filter) => filter.id !== ''));
        mergeToFilterDetails({
          filters: filterArr,
        });
      }
    }

    // Add CSA to clear filters
    function clearFilters() {
      setAllFilters([]);
      mergeToFilterDetails({
        filters: [],
      });
    }

    setExposedVariables({ setFilters, clearFilters });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(props.columns)]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debounceFn = React.useCallback(
    _.debounce(() => {
      fireEvent('onFilterChanged');
    }, 700),
    []
  );
  const selectStyles = (width) => {
    return {
      ...defaultStyles(darkMode, width),
      menuPortal: (provided) => ({ ...provided, zIndex: 999 }),
      menuList: (base) => ({
        ...base,
      }),
    };
  };

  if (!filterDetails.filtersVisible) {
    return null;
  }

  return (
    <div className={`table-filters card ${darkMode ? 'dark-theme theme-dark' : 'light-theme'}`}>
      <div className="card-header row">
        <div className="col">
          <h4 data-cy={`header-filters`} className="font-weight-normal">
            Filters
          </h4>
        </div>
        <div className="col-auto">
          <button data-cy={`button-close-filters`} onClick={() => props.hideFilters()} className="btn btn-light btn-sm">
            x
          </button>
        </div>
      </div>
      <div
        style={{
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
        className="card-body"
      >
        {props.filters.map((filter, index) => (
          <div className="row mb-2" key={index}>
            <div className="col p-2" style={{ maxWidth: '70px' }}>
              <small data-cy={`label-filter-column`}>{index > 0 ? 'and' : 'column'}</small>
            </div>
            <div data-cy={`select-coloumn-dropdown-${index ?? ''}`} className="col">
              <Select
                options={props.columns}
                value={filter.id}
                search={true}
                onChange={(value) => filterColumnChanged(index, value)}
                placeholder={t('globals.select', 'Select') + '...'}
                className={`${darkMode ? 'select-search-dark' : 'select-search'} mb-0`}
                styles={selectStyles('100%')}
                useCustomStyles={true}
                darkMode={darkMode}
              />
            </div>
            <div data-cy={`select-operation-dropdown-${index ?? ''}`} className="col" style={{ maxWidth: '180px' }}>
              <Select
                options={FILTER_OPTIONS}
                value={filter.value.condition}
                search={true}
                onChange={(value) => {
                  filterOperationChanged(index, value);
                }}
                className={`${darkMode ? 'select-search-dark' : 'select-search'}`}
                placeholder={t('globals.select', 'Select') + '...'}
                styles={selectStyles('100%')}
                dataCy={`select-coloumn-dropdown-${index ?? ''}`}
                useCustomStyles={true}
                darkMode={darkMode}
              />
            </div>
            <div className="col">
              {['isEmpty', 'isNotEmpty'].includes(filter.value.condition) || (
                <input
                  data-cy={`data-filtervalue-input-${index ?? ''}`}
                  type="text"
                  value={filter.value.value}
                  placeholder="value"
                  className="form-control"
                  onChange={(e) => filterValueChanged(index, e.target.value)}
                />
              )}
            </div>
            <div className="col-auto">
              <button
                data-cy={`button-close-filter-${index ?? ''}`}
                onClick={() => removeFilter(index)}
                className={`btn ${darkMode ? 'btn-dark' : 'btn-light'} btn-sm p-2 text-danger font-weight-bold`}
              >
                x
              </button>
            </div>
          </div>
        ))}
        {props.filters.length === 0 && (
          <div>
            <center>
              <span data-cy={`label-no-filters`}>no filters yet.</span>
            </center>
          </div>
        )}
      </div>
      <div className="card-footer d-flex custom-gap-8">
        <ButtonSolid
          variant="primary"
          className={`tj-text-xsm`}
          onClick={addFilter}
          size="sm"
          customStyles={{ padding: '10px 20px' }}
          data-cy={'button-add-filter'}
        >
          <span>+ add filter</span>
        </ButtonSolid>

        <ButtonSolid
          variant="tertiary"
          className={`tj-text-xsm`}
          onClick={clearFilters}
          size="sm"
          customStyles={{ padding: '10px 20px' }}
          data-cy={'button-clear-filters'}
        >
          <span>clear filters</span>
        </ButtonSolid>
      </div>
    </div>
  );
}

const findFilterDiff = (oldFilters, newFilters) => {
  const filterDiff = deepDiff(oldFilters, newFilters);

  const getType = (obj) => {
    if (!obj?.column && !obj?.condition) {
      return 'value';
    }

    if (obj?.column) {
      return 'column';
    }

    if (obj?.condition) {
      return 'condition';
    }
  };

  const diff = Object.entries(filterDiff).reduce((acc, [key, value]) => {
    const type = getType(value?.value);
    return (acc = { ...acc, keyIndex: key, type: type, diff: value?.value?.[type] });
  }, {});

  return shouldFireEvent(diff, newFilters);
};

function shouldFireEvent(diff, filter) {
  if (!diff || !filter) return false;

  function forEmptyOperationAndNotEmptyOperation(condition) {
    if (condition !== 'isEmpty' || condition !== 'isNotEmpty') {
      return filter[diff.keyIndex]?.value?.column ? true : false;
    }

    return filter[diff.keyIndex]?.value?.value && filter[diff.keyIndex]?.value?.column ? true : false;
  }

  switch (diff.type) {
    case 'value':
      return filter[diff.keyIndex]?.value?.column && filter[diff.keyIndex]?.value?.condition ? true : false;

    case 'column':
      return filter[diff.keyIndex]?.value?.value && filter[diff.keyIndex]?.value?.condition ? true : false;

    case 'condition':
      return forEmptyOperationAndNotEmptyOperation(filter[diff.keyIndex]?.value?.condition);

    default:
      return false;
  }
}
