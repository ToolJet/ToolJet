import React, { useState, useEffect } from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';

export const Tags = ({ value, onChange, readOnly, containerWidth = '' }) => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [hovered, setHovered] = useState(false);
  const elem = document.querySelector('.table-tags-col-container');

  useEffect(() => {
    if (hovered) {
      setShowOverlay(true);
    } else {
      setShowOverlay(false);
    }
  }, [hovered]);

  const isValid = Array.isArray(value);
  if (!isValid) console.warn('[Tags]: value provided is not an array');
  value = isValid ? value : [];

  const [showForm, setShowForm] = useState(false);

  function addTag(text) {
    if (text !== '') {
      value.push(text);
      onChange(value);
    } else {
      setShowForm(false);
    }
  }

  function removeTag(text) {
    const newValue = value.filter((tag) => tag !== text);
    onChange(newValue);
    setShowForm(false);
  }

  function handleFormKeyDown(e) {
    if (e.key === 'Enter') {
      addTag(e.target.value);
    }
  }

  function renderTag(text) {
    return (
      <span className="col-auto badge bg-blue-lt p-2 mx-1 tag">
        {String(text)}
        {!readOnly && (
          <span className="badge badge-pill bg-red-lt remove-tag-button cursor-pointer" onClick={() => removeTag(text)}>
            x
          </span>
        )}
      </span>
    );
  }

  const getOverlay = (value, containerWidth) => {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    return Array.isArray(value) ? (
      <div
        style={{
          maxWidth: containerWidth,
          width: containerWidth,
        }}
        className={`overlay-cell-table overlay-tags-table ${darkMode && 'dark-theme'}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {value?.map((tag, index) => {
          return (
            <span
              key={index}
              style={{
                wordWrap: 'break-word', // Add word-wrap property for content wrapping
                display: 'flex',
                flexWrap: 'wrap',
                overflow: 'auto',
              }}
            >
              {renderTag(tag)}
            </span>
          );
        })}
      </div>
    ) : (
      <div></div>
    );
  };

  return (
    <OverlayTrigger
      placement="bottom"
      overlay={getOverlay(value, containerWidth)}
      trigger={
        elem &&
        (elem?.clientHeight < elem?.scrollHeight || elem?.clientWidth < elem?.scrollWidth) &&
        !showForm &&
        value?.length >= 1 && ['click']
      }
      rootClose={true}
      show={
        elem &&
        (elem?.clientHeight < elem?.scrollHeight || elem?.clientWidth < elem?.scrollWidth) &&
        value?.length >= 1 &&
        showOverlay
      }
    >
      <div
        className={`tags row h-100 ${readOnly ? 'm-0 tj-table-tag-col-readonly' : ''}`}
        style={{ display: 'flex', alignItems: 'center' }}
        onMouseMove={() => {
          if (!hovered) setHovered(true);
        }}
        onMouseOut={() => setHovered(false)}
      >
        {/* Container for renderTags */}
        {!showForm && (
          <div
            className={`render-tags-container table-tags-col-container h-100 d-flex flex-wrap custom-gap-3 ${
              readOnly ? 'p-0' : 0
            }`}
            style={{ width: readOnly ? '100' : '80%', overflow: 'hidden' }}
          >
            {value.map((item, index) => (
              <span key={index} className="col-auto tag-wrapper">
                {renderTag(item)}
              </span>
            ))}
          </div>
        )}
        {/* Container for + button */}
        {!showForm && !readOnly && (
          <div className="add-tag-container" style={{ width: '20%' }}>
            <span className="col-auto">
              <span className="badge bg-green-lt mx-1 add-tag-button" onClick={() => setShowForm(true)}>
                {'+'}
              </span>
            </span>
          </div>
        )}

        {/* Input element */}
        {showForm && (
          <div className="col-auto badge bg-green-lt mx-1">
            <input
              type="text"
              autoFocus
              className="form-control-plaintext"
              onBlur={(e) => addTag(e.target.value)}
              onKeyDown={handleFormKeyDown}
            />
          </div>
        )}
      </div>
    </OverlayTrigger>
  );
};
