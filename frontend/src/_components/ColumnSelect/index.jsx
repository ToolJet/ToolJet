import React, { useState, useEffect, useCallback } from 'react';
import { dataqueryService } from '@/_services';
import Select from '@/_ui/Select';

/**
 * ColumnSelect – a dropdown populated with columns fetched from the connected
 * data source via `invokeMethod('listColumns', { values: { schema, table } })`.
 *
 * When the data source or table is unavailable, renders an empty disabled Select.
 *
 * Props:
 *   selectedDataSource      – the active data source object (needs .id)
 *   currentAppEnvironmentId – current environment id string
 *   schema                  – schema name (string)
 *   table                   – table name (string)
 *   value                   – selected column name (string) or array of names when isMulti=true
 *   onChange                – (columnName: string) => void  OR  (columns: string[]) => void when isMulti
 *   placeholder             – Select placeholder text
 *   darkMode                – boolean
 *   isMulti                 – when true renders a multi-select; onChange receives string[]
 */
const ColumnSelect = React.memo(function ColumnSelect({
  selectedDataSource,
  currentAppEnvironmentId,
  schema,
  table,
  value,
  onChange,
  placeholder = 'Select column',
  darkMode = false,
  isMulti = false,
}) {
  const [columns, setColumns] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const canFetch = !!(selectedDataSource?.id && table);

  const fetchColumns = useCallback(async () => {
    if (!canFetch) return;
    setIsLoading(true);
    try {
      const args = { values: { schema: schema || 'public', table } };
      const environmentId = currentAppEnvironmentId != null ? String(currentAppEnvironmentId) : '';
      const response = await dataqueryService.invoke(selectedDataSource.id, 'listColumns', environmentId, args);
      const payload = response?.data ?? response;
      const items = Array.isArray(payload) ? payload : payload?.data || [];
      setColumns(items);
    } catch {
      setColumns([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDataSource?.id, currentAppEnvironmentId, schema, table, canFetch]);

  useEffect(() => {
    fetchColumns();
  }, [fetchColumns]);

  const selectedOption = isMulti
    ? (Array.isArray(value) ? value : []).map((v) => columns.find((c) => c.value === v) ?? { value: v, label: v })
    : value
    ? columns.find((c) => c.value === value) ?? { value, label: value }
    : null;

  const handleChange = (opt) => {
    if (isMulti) {
      onChange(opt ? opt.map((o) => o.value) : []);
    } else {
      // SelectComponent already unwraps the option to its .value (a string) before calling onChange
      onChange(opt ?? '');
    }
  };

  return (
    <Select
      options={columns}
      value={selectedOption}
      onChange={handleChange}
      placeholder={isLoading ? 'Loading...' : placeholder}
      isLoading={isLoading}
      isDisabled={isLoading || !canFetch}
      isMulti={isMulti}
      closeMenuOnSelect={!isMulti}
      useMenuPortal
      styles={
        darkMode
          ? {
              control: (provided) => ({
                ...provided,
                minHeight: 28,
                backgroundColor: '#2b3547',
                border: '1px solid var(--slate7)',
                boxShadow: 'none',
              }),
              menu: (provided) => ({ ...provided, backgroundColor: 'rgb(31,40,55)' }),
              option: (provided) => ({
                ...provided,
                backgroundColor: '#2b3547',
                color: '#fff',
                ':hover': { backgroundColor: '#323C4B' },
              }),
              singleValue: (provided) => ({ ...provided, color: '#fff' }),
              placeholder: (provided) => ({ ...provided, color: '#fff', fontSize: '12px' }),
            }
          : {}
      }
      useCustomStyles={darkMode}
    />
  );
});

export default ColumnSelect;
