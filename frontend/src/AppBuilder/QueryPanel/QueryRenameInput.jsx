import React, { useState, useEffect, useRef } from 'react';
import { decodeEntities } from '@/_helpers/utils';

export const QueryRenameInput = ({ dataQuery, darkMode, onUpdate }) => {
  const [value, setValue] = useState('');
  const escapeRef = useRef(false);

  useEffect(() => {
    setValue(decodeEntities(dataQuery.name));
  }, [dataQuery.name]);

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.currentTarget.blur();
    }
    if (event.key === 'Escape') {
      escapeRef.current = true;
      event.currentTarget.blur();
    }
  };

  const handleBlur = () => {
    if (escapeRef.current) {
      escapeRef.current = false;
      onUpdate(dataQuery, dataQuery.name);
      return;
    }
    onUpdate(dataQuery, value);
  };

  const handleChange = (event) => {
    const sanitizedValue = event.target.value.replace(/[ \t&]/g, '');
    setValue(sanitizedValue);
  };

  return (
    <input
      data-cy={`query-edit-input-field`}
      className="query-name"
      style={{
        flex: 1,
        width: '100%',
        height: '28px',
        border: '2px solid #4368e3',
        borderRadius: '6px',
        background: darkMode ? 'var(--surfaces-surface-02, #1f2936)' : '#fff',
        color: darkMode ? '#fff' : 'var(--text-default, #1b1f24)',
        fontSize: '12px',
        lineHeight: '18px',
        padding: '0 6px',
        outline: 'none',
      }}
      type="text"
      value={value}
      onChange={handleChange}
      autoFocus={true}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
    />
  );
};
