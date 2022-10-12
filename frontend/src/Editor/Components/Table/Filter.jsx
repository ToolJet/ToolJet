import React from 'react';
import Select from '@/_ui/Select';
import defaultStyles from '@/_ui/Select/styles';
import { useTranslation } from 'react-i18next';
import _ from 'lodash';
// eslint-disable-next-line import/no-unresolved
import { diff as deepDiff } from 'deep-object-diff';

export function Filter(props) {
  const { t } = useTranslation();

  const { mergeToFilterDetails, filterDetails, setAllFilters, fireEvent, darkMode } = props;
  const { filters } = filterDetails;

  const [activeFilters, set] = React.useState(filters);

  function filterColumnChanged(index, value, name) {
    const newFilters = filters;
    newFilters[index].id = value;
    newFilters[index].value.where = name;
    mergeToFilterDetails({
      filters: newFilters,
    });
    setAllFilters(newFilters.filter((filter) => filter.id !== ''));
  }

  function filterOperationChanged(index, value) {
    const newFilters = filters;
    newFilters[index].value = {
      ...newFilters[index].value,
      operation: value,
    };
    mergeToFilterDetails({
      filters: newFilters,
    });
    setAllFilters(newFilters.filter((filter) => filter.id !== ''));
  }

  function filterValueChanged(index, value) {
    const newFilters = filters;
    newFilters[index].value = {
      ...newFilters[index].value,
      value: value,
    };
    mergeToFilterDetails({
      filters: newFilters,
    });
    setAllFilters(newFilters.filter((filter) => filter.id !== ''));
  }

  function addFilter() {
    mergeToFilterDetails({ filters: [...filters, { id: '', value: { operation: 'contains', value: '' } }] });
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

  React.useEffect(() => {
    if (filters.length > 0) {
      const tableFilters = JSON.parse(JSON.stringify(filters));
      const shouldFire = findFilterDiff(activeFilters, tableFilters);
      if (shouldFire) debounceFn();
      set(tableFilters);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

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

  return (
    <div className="table-filters card">
      <div className="card-header row">
        <div className="col">
          <h4 className="font-weight-normal">Filters</h4>
        </div>
        <div className="col-auto">
          <button onClick={() => props.hideFilters()} className="btn btn-light btn-sm">
            x
          </button>
        </div>
      </div>
      <div className="card-body">
        {props.filters.map((filter, index) => (
          <div className="row mb-2" key={index}>
            <div className="col p-2" style={{ maxWidth: '70px' }}>
              <small>{index > 0 ? 'and' : 'where'}</small>
            </div>
            <div className="col">
              <Select
                options={props.columns}
                value={filter.id}
                search={true}
                onChange={(value, item) => {
                  filterColumnChanged(index, value, item.name);
                }}
                placeholder={t('globals.select', 'Select') + '...'}
                styles={selectStyles('100%')}
              />
            </div>
            <div className="col" style={{ maxWidth: '180px' }}>
              <Select
                options={[
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
                ]}
                value={filter.value.operation}
                search={true}
                onChange={(value) => {
                  filterOperationChanged(index, value);
                }}
                placeholder={t('globals.select', 'Select') + '...'}
                styles={selectStyles('100%')}
              />
            </div>
            <div className="col">
              {['isEmpty', 'isNotEmpty'].includes(filter.value.operation) || (
                <input
                  type="text"
                  value={filter.value.value}
                  placeholder="value"
                  className="form-control"
                  onChange={(e) => _.debounce(filterValueChanged(index, e.target.value), 500)}
                />
              )}
            </div>
            <div className="col-auto">
              <button
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
              <span>no filters yet.</span>
            </center>
          </div>
        )}
      </div>
      <div className="card-footer">
        <button onClick={addFilter} className="btn btn-light btn-sm">
          + add filter
        </button>
        <button onClick={() => clearFilters()} className="btn btn-light btn-sm mx-2">
          clear filters
        </button>
      </div>
    </div>
  );
}

const findFilterDiff = (oldFilters, newFilters) => {
  const filterDiff = deepDiff(oldFilters, newFilters);

  const getType = (obj) => {
    if (!obj?.where && !obj?.operation) {
      return 'value';
    }

    if (obj?.where) {
      return 'where';
    }

    if (obj?.operation) {
      return 'operation';
    }
  };

  const diff = Object.entries(filterDiff).reduce((acc, [key, value]) => {
    const type = getType(value.value);
    return (acc = { ...acc, keyIndex: key, type: type, diff: value.value[type] });
  }, {});

  return shouldFireEvent(diff, newFilters);
};

function shouldFireEvent(diff, filter) {
  if (!diff || !filter) return false;

  switch (diff.type) {
    case 'value':
      return filter[diff.keyIndex].value.where && filter[diff.keyIndex].value.operation ? true : false;

    case 'where':
      return filter[diff.keyIndex].value.value && filter[diff.keyIndex].value.operation ? true : false;

    case 'operation':
      return filter[diff.keyIndex].value.value && filter[diff.keyIndex].value.where ? true : false;

    default:
      return false;
  }
}
