import React, { useState, useEffect } from 'react';
import { decodeEntities } from '@/_helpers/utils';

export const QueryRenameInput = ({ dataQuery, darkMode, onUpdate }) => {
  const [value, setValue] = useState('');

  useEffect(() => {
    setValue(decodeEntities(dataQuery.name));
  }, [dataQuery.name]);

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      onUpdate(dataQuery, value);
    }
  };

  const handleBlur = () => {
    onUpdate(dataQuery, value);
  };

  const handleChange = (event) => {
    const sanitizedValue = event.target.value.replace(/[ \t&]/g, '');
    setValue(sanitizedValue);
  };

  return (
    <input
      data-cy={`query-edit-input-field`}
      className={`query-name query-name-input-field border-indigo-09 bg-transparent  ${darkMode && 'text-white'
        }`}
      type="text"
      value={value}
      onChange={handleChange}
      autoFocus={true}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
    />
  );
};