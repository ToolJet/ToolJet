import React, { useEffect, useState } from 'react';
import { isEmpty } from 'lodash';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';

export default function FolderFilter({ disabled, options, onChange, value }) {
  const navigate = useNavigate();
  const [currentFolder, setCurrentFolder] = useState({});

  const handleFolderChange = (folder) => {
    onChange(folder);
    updateFolderQuery(folder?.name, folder?.id);
  };

  const updateFolderQuery = (name, id) => {
    const path = `${id ? `?folder=${name}` : ''}`;
    navigate({ pathname: location.pathname, search: path }, { replace: true });
  };

  const allOptions = [{ name: 'All apps', label: 'All apps', value: '', id: '' }, ...options];
  const currentValue = { label: currentFolder?.name, ...currentFolder };

  useEffect(() => {
    if (isEmpty(value)) {
      setCurrentFolder({ name: 'All apps', label: 'All apps', value: '', id: '' });
    } else {
      setCurrentFolder(value);
      handleFolderChange(value);
    }
  }, [value]);

  return (
    <Select
      options={allOptions}
      onChange={handleFolderChange}
      value={currentValue}
      closeMenuOnSelect={true}
      styles={{
        dropdownIndicator: (base) => ({
          ...base,
          padding: '4px 8px',
        }),
        indicatorSeparator: (base) => ({
          ...base,
          display: 'none',
        }),
        container: (base) => ({
          ...base,
          backgroundColor: 'var(--slate6)',
          borderRadius: '20px',
        }),
        control: (base) => ({
          ...base,
          backgroundColor: 'var(--slate6)',
          border: '0',
          boxShadow: 'none',
          height: '32px',
          minHeight: '32px',
          minWidth: '110px',
          borderRadius: '20px',
          '&:hover': {
            border: '1px solid var(--slate8)',
          },
        }),
      }}
    />
  );
}
