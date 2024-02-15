import React, { useEffect, useRef, useState } from 'react';
import { isEmpty } from 'lodash';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';

export default function FolderFilter({ disabled, options, onChange, value }) {
  const navigate = useNavigate();
  const [currentFolder, setCurrentFolder] = useState({});
  const defaultFolder = { name: 'All apps', label: 'All apps', value: '', id: '' };
  let selectRef = useRef();

  const handleFolderChange = (folder) => {
    onChange(folder);
    updateFolderQuery(folder?.name, folder?.id);
  };

  const updateFolderQuery = (name, id) => {
    const path = `${id ? `?folder=${name}` : ''}`;
    navigate({ pathname: location.pathname, search: path }, { replace: true });
  };

  useEffect(() => {
    if (isEmpty(value)) {
      setCurrentFolder(defaultFolder);
    } else {
      setCurrentFolder({ ...value, value: value?.id });
      handleFolderChange(value);
    }
  }, [value]);

  const allOptions = [defaultFolder, ...options];
  const currentValue = { label: currentFolder?.name, ...currentFolder };

  return (
    <Select
      ref={selectRef}
      options={allOptions}
      onChange={handleFolderChange}
      value={currentValue}
      defaultValue={currentValue}
      closeMenuOnSelect={true}
      styles={{
        option: (base, state) => {
          const currentOption = state.getValue('All apps')[0];
          const isSelectedOption = currentOption.label === 'All apps';
          return {
            ...base,
            ...(state.isFocused && !isSelectedOption && { backgroundColor: 'var(--slate0)', color: 'var(--slate12)' }),
          };
        },
        singleValue: (base) => ({
          ...base,
          color: 'var(--slate12)',
        }),
        menu: (base) => ({
          ...base,
          background: 'var(--slate2)',
        }),
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
