import React, { useState } from 'react';

export const Tags = ({ value, onChange, readOnly }) => {
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
      <span className="col-auto badge bg-blue-lt p-2 mx-1 tag mb-2">
        {text}
        {!readOnly && (
          <span className="badge badge-pill bg-red-lt remove-tag-button" onClick={() => removeTag(text)}>
            x
          </span>
        )}
      </span>
    );
  }

  return (
    <div className="tags row">
      {value.map((item) => {
        return renderTag(item);
      })}

      {!showForm && !readOnly && (
        <span className="col-auto badge bg-green-lt mx-1 add-tag-button" onClick={() => setShowForm(true)}>
          {'+'}
        </span>
      )}

      {showForm && (
        <span className="col-auto badge bg-green-lt mx-1">
          <input
            type="text"
            autoFocus
            className="form-control-plaintext"
            onBlur={(e) => addTag(e.target.value)}
            onKeyDown={handleFormKeyDown}
          />
        </span>
      )}
    </div>
  );
};
