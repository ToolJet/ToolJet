import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';

export const TagsColumn = ({ value: initialValue, onChange, readOnly, containerWidth = '' }) => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    setShowOverlay(hovered);
  }, [hovered]);

  const isValid = Array.isArray(initialValue);
  if (!isValid) console.warn('[Tags]: value provided is not an array');
  const value = useMemo(() => (isValid ? initialValue : []), [initialValue, isValid]);

  const handleAddTag = useCallback(
    (text) => {
      if (!text.trim()) {
        setShowForm(false);
        return;
      }
      onChange([...value, text]);
      setShowForm(false);
    },
    [value, onChange]
  );

  const handleRemoveTag = useCallback(
    (text) => {
      const newValue = value.filter((tag) => tag !== text);
      onChange(newValue);
      setShowForm(false);
    },
    [value, onChange]
  );

  const handleFormKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddTag(e.target.value);
      } else if (e.key === 'Escape') {
        setShowForm(false);
      }
    },
    [handleAddTag]
  );

  const renderTag = useCallback(
    (text) => (
      <span className="col-auto badge bg-blue-lt p-2 mx-1 tag" role="listitem">
        {String(text)}
        {!readOnly && (
          <span
            className="badge badge-pill bg-red-lt remove-tag-button cursor-pointer"
            onClick={() => handleRemoveTag(text)}
            onKeyDown={(e) => e.key === 'Enter' && handleRemoveTag(text)}
            role="button"
            tabIndex={0}
            aria-label={`Remove ${text}`}
          >
            x
          </span>
        )}
      </span>
    ),
    [readOnly, handleRemoveTag]
  );

  const getOverlay = useCallback(
    (value, containerWidth) => {
      const darkMode = localStorage.getItem('darkMode') === 'true';
      return Array.isArray(value) ? (
        <div
          style={{
            maxWidth: containerWidth,
            width: containerWidth,
          }}
          className={`overlay-cell-table overlay-tags-table ${darkMode ? 'dark-theme' : ''}`}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          role="list"
          aria-label="Tags overlay"
        >
          {value?.map((tag, index) => (
            <span
              key={index}
              style={{
                wordWrap: 'break-word',
                display: 'flex',
                flexWrap: 'wrap',
                overflow: 'auto',
              }}
            >
              {renderTag(tag)}
            </span>
          ))}
        </div>
      ) : (
        <div />
      );
    },
    [renderTag]
  );

  const isOverflowing = useCallback(() => {
    if (!containerRef.current) return false;
    return (
      containerRef.current.clientHeight < containerRef.current.scrollHeight ||
      containerRef.current.clientWidth < containerRef.current.scrollWidth
    );
  }, []);

  return (
    <OverlayTrigger
      placement="bottom"
      overlay={getOverlay(value, containerWidth)}
      trigger={isOverflowing() && !showForm && value?.length >= 1 ? ['click'] : []}
      rootClose={true}
      show={isOverflowing() && value?.length >= 1 && showOverlay}
    >
      <div
        className={`tags row h-100 ${readOnly ? 'm-0 tj-table-tag-col-readonly' : ''}`}
        style={{ display: 'flex', alignItems: 'center' }}
        onMouseMove={() => !hovered && setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        role="region"
        aria-label="Tags container"
      >
        {!showForm && (
          <div
            ref={containerRef}
            className={`render-tags-container table-tags-col-container h-100 d-flex flex-wrap custom-gap-3 ${
              readOnly ? 'p-0' : ''
            }`}
            style={{ width: readOnly ? '100%' : '80%', overflow: 'hidden' }}
            role="list"
          >
            {value.map((item, index) => (
              <span key={index} className="col-auto tag-wrapper">
                {renderTag(item)}
              </span>
            ))}
          </div>
        )}

        {!showForm && !readOnly && (
          <div className="add-tag-container" style={{ width: '20%' }}>
            <span className="col-auto">
              <span
                className="badge bg-green-lt mx-1 add-tag-button"
                onClick={() => setShowForm(true)}
                onKeyDown={(e) => e.key === 'Enter' && setShowForm(true)}
                role="button"
                tabIndex={0}
                aria-label="Add new tag"
              >
                +
              </span>
            </span>
          </div>
        )}

        {showForm && (
          <div className="col-auto badge bg-green-lt mx-1">
            <input
              type="text"
              autoFocus
              className="form-control-plaintext"
              onBlur={(e) => handleAddTag(e.target.value)}
              onKeyDown={handleFormKeyDown}
              aria-label="New tag input"
            />
          </div>
        )}
      </div>
    </OverlayTrigger>
  );
};
