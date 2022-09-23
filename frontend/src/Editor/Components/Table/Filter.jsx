import React from 'react';
import SelectSearch, { fuzzySearch } from 'react-select-search';
import { useTranslation } from 'react-i18next';

export function Filter(props) {
  const { t } = useTranslation();

  const { mergeToFilterDetails, filterDetails, setAllFilters } = props;
  const { filters } = filterDetails;

  function filterColumnChanged(index, value) {
    const newFilters = filters;
    newFilters[index].id = value;
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
  }

  function clearFilters() {
    mergeToFilterDetails({
      filters: [],
    });
    setAllFilters([]);
  }

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
              <SelectSearch
                options={props.columns}
                value={filter.id}
                search={true}
                onChange={(value) => {
                  filterColumnChanged(index, value);
                }}
                filterOptions={fuzzySearch}
                placeholder={t('globals.select', 'Select') + '...'}
              />
            </div>
            <div className="col" style={{ maxWidth: '180px' }}>
              <SelectSearch
                options={[
                  { name: 'contains', value: 'contains' },
                  { name: 'matches', value: 'matches' },
                  { name: 'does not match', value: 'nl' },
                  { name: 'equals', value: 'equals' },
                  { name: 'does not equal', value: 'ne' },
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
                filterOptions={fuzzySearch}
                placeholder="Select.."
              />
            </div>
            <div className="col">
              <input
                type="text"
                value={filter.value.value}
                placeholder="value"
                className="form-control"
                onChange={(e) => filterValueChanged(index, e.target.value)}
              />
            </div>
            <div className="col-auto">
              <button
                onClick={() => removeFilter(index)}
                className={`btn ${props.darkMode ? 'btn-dark' : 'btn-light'} btn-sm p-2 text-danger font-weight-bold`}
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
