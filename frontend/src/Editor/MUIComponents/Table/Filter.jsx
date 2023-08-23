import React from 'react';
import defaultStyles from '@/_ui/Select/styles';
import { useTranslation } from 'react-i18next';
import _ from 'lodash';
// eslint-disable-next-line import/no-unresolved
import { diff as deepDiff } from 'deep-object-diff';

import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import { CloseOutlined, DeleteOutline } from '@mui/icons-material';

export function Filter(props) {
  const { t } = useTranslation();

  const { mergeToFilterDetails, filterDetails, setAllFilters, fireEvent, darkMode } = props;
  const { filters } = filterDetails;

  const [activeFilters, set] = React.useState(filters);

  function filterColumnChanged(index, value) {
    const filter = props.columns.find((column) => column.value === value);
    const newFilters = filters;
    newFilters[index].id = filter.value;
    newFilters[index].value.column = filter.name;
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
    mergeToFilterDetails({
      filters: [...filters, { id: '', value: { condition: 'contains', value: '' } }],
    });
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
    <>
      <Dialog
        open={props.openFilter}
        onClose={props.hideFilters}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        container={document.getElementsByClassName('card jet-table')[0]}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography
            variant="h5"
            data-cy={`header-filters`}
          >
            Filters
          </Typography>
          <IconButton
            data-cy={`button-close-filters`}
            onClick={() => props.hideFilters()}
          >
            <CloseOutlined color="primary" />
          </IconButton>
        </DialogTitle>
        <Divider color="#1a73e8" />
        <DialogContent>
          <Box
            sx={{
              overflowY: 'auto',
              overflowX: 'hidden',
            }}
            className="card-body"
          >
            {props.filters.map((filter, index) => {
              return (
                <Box
                  display="flex"
                  flexDirection="row"
                  alignItems="center"
                  justifyContent="space-around"
                  marginBottom="12px"
                  key={index}
                >
                  <Typography
                    data-cy={`label-filter-column`}
                    sx={{ maxWidth: '70px', minWidth: '70px' }}
                    variant="body1"
                  >
                    {index > 0 ? 'and' : 'column'}
                  </Typography>
                  <Box data-cy={`select-coloumn-dropdown-${index ?? ''}`}>
                    <Autocomplete
                      disablePortal
                      autoComplete
                      size="small"
                      fullWidth
                      sx={{ minWidth: '200px' }}
                      options={props.columns}
                      value={filter.value.column}
                      getOptionLabel={(option) => option.name}
                      isOptionEqualToValue={(option, value) => option.value === value.value}
                      onChange={(event, newValue) => {
                        filterColumnChanged(index, newValue.value);
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          label={t('globals.select', 'Select') + '...'}
                        />
                      )}
                    />
                  </Box>
                  <Box data-cy={`select-operation-dropdown-${index ?? ''}`}>
                    <Autocomplete
                      disablePortal
                      autoComplete
                      size="small"
                      fullWidth
                      sx={{ minWidth: '280px' }}
                      options={[
                        { label: 'contains', value: 'contains' },
                        { label: 'does not contains', value: 'doesNotContains' },
                        { label: 'matches', value: 'matches' },
                        { label: 'does not match', value: 'nl' },
                        { label: 'equals', value: 'equals' },
                        { label: 'does not equal', value: 'ne' },
                        { label: 'is empty', value: 'isEmpty' },
                        { label: 'is not empty', value: 'isNotEmpty' },
                        { label: 'greater than', value: 'gt' },
                        { label: 'less than', value: 'lt' },
                        { label: 'greater than or equals', value: 'gte' },
                        { label: 'less than or equals', value: 'lte' },
                      ]}
                      value={filter.value.condition}
                      isOptionEqualToValue={(option, value) => option.value === value}
                      onChange={(event, newValue) => {
                        filterOperationChanged(index, newValue.value);
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          label={t('globals.select', 'Select') + '...'}
                        />
                      )}
                    />
                  </Box>

                  <Box>
                    {['isEmpty', 'isNotEmpty'].includes(filter.value.condition) || (
                      <TextField
                        data-cy={`data-filtervalue-input-${index ?? ''}`}
                        type="text"
                        size="small"
                        fullWidth
                        value={filter.value.value}
                        placeholder="value"
                        onChange={(e) => _.debounce(filterValueChanged(index, e.target.value), 500)}
                      />
                    )}
                  </Box>

                  <IconButton
                    data-cy={`button-close-filter-${index ?? ''}`}
                    onClick={() => removeFilter(index)}
                  >
                    <DeleteOutline color="error" />
                  </IconButton>
                </Box>
              );
            })}
            {props.filters.length === 0 && (
              <Box
                display="flex"
                width="100%"
                height="100%"
                justifyContent="center"
                alignItems="center"
                data-cy={`label-no-filters`}
              >
                No filters yet.
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            data-cy={`button-add-filter`}
            variant="contained"
            size="small"
            onClick={addFilter}
          >
            Add filter
          </Button>
          <Button
            data-cy={`button-clear-filters`}
            variant="contained"
            color="error"
            size="small"
            onClick={() => clearFilters()}
          >
            Clear filters
          </Button>
        </DialogActions>
      </Dialog>
    </>
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
    const type = getType(value.value);
    return (acc = { ...acc, keyIndex: key, type: type, diff: value.value[type] });
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
