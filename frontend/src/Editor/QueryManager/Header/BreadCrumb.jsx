import React, { useState } from 'react';
import QMIcons from '../QMIcons';

export default function BreadCrumb(props) {
  const { darkMode, onFirstBreadCrumbClick, mode, onSave, queryName, show } = props;
  const [showInput, setShowInput] = useState(false);

  const handleKeyUp = async (event) => {
    event.persist();
    if (event.keyCode === 13) {
      await onSave(event.target.value);
      setShowInput(false);
    }
  };

  if (!show) return '';

  return (
    <>
      <span
        className={`${darkMode ? 'color-light-gray-c3c3c3' : 'color-light-slate-11'} cursor-pointer font-weight-400`}
        onClick={onFirstBreadCrumbClick}
        data-cy={`query-type-header`}
      >
        {mode === 'create' ? 'New Query' : 'Queries'}
      </span>
      <span className="breadcrum">
        <QMIcons.BreadCrumb />
      </span>
      <div className="query-name-breadcrum d-flex align-items-center">
        <span
          className={`query-manager-header-query-name font-weight-400 ${!showInput && 'ellipsis'}`}
          data-cy={`query-name-label`}
        >
          {showInput ? (
            <input
              data-cy={`query-rename-input`}
              type="text"
              className={`query-name query-name-input-field border-indigo-09 bg-transparent  ${
                darkMode && 'text-white'
              }`}
              autoFocus
              defaultValue={queryName}
              onKeyUp={handleKeyUp}
              onBlur={({ target }) => onSave(target.value)}
            />
          ) : (
            queryName
          )}
        </span>
        <span className={`breadcrum-rename-query-icon ${showInput && 'd-none'}`} onClick={() => setShowInput(true)}>
          <QMIcons.Edit />
        </span>
      </div>
    </>
  );
}
