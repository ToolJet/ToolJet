import React from 'react';
import { Box, TextField } from '@mui/material';
import { SearchOutlined } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

// Table Search
export const GlobalFilter = ({
  globalFilter,
  useAsyncDebounce,
  setGlobalFilter,
  onComponentOptionChanged,
  component,
  onEvent,
  darkMode,
}) => {
  const [value, setValue] = React.useState(globalFilter);
  const { t } = useTranslation();

  const onChange = useAsyncDebounce((filterValue) => {
    setValue(filterValue);
    setGlobalFilter(filterValue || undefined);
    onComponentOptionChanged(component, 'searchText', filterValue).then(() => {
      onEvent('onSearch', { component, data: {} });
    });
  }, 500);

  return (
    <Box
      sx={{
        p: 0.5,
        pb: 0,
      }}
    >
      <TextField
        sx={{ width: '100%' }}
        variant="outlined"
        size="small"
        defaultValue={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('globals.search', 'Search…')}
        autoFocus
        InputProps={{
          startAdornment: <SearchOutlined />,
        }}
      />
    </Box>
  );
};
