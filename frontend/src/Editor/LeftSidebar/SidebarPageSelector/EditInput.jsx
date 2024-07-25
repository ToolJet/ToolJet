import React, { useState, useRef, useEffect } from 'react';
import { ToolTip } from '@/Editor/Inspector/Elements/Components/ToolTip';

export const EditInput = ({ slug, error, setError, pageHandle, setPageHandle, isSaving = false }) => {
  const [value, set] = useState(pageHandle);
  const inputRef = useRef(null);
  const cursorPositionRef = useRef(null);

  const onChangePageHandleValue = (event) => {
    setError(null);
    const newHandle = event.target.value;

    if (newHandle === '') setError('Page handle cannot be empty');
    if (newHandle === value) setError('Page handle cannot be same as the existing page handle');

    set(newHandle);
  };

  const handleInput = () => {
    if (inputRef.current) {
      cursorPositionRef.current = inputRef.current.selectionStart;
    }
  };

  useEffect(() => {
    if (!isSaving) {
      setPageHandle(value);

      if (inputRef.current && cursorPositionRef.current !== null) {
        inputRef.current.setSelectionRange(cursorPositionRef.current, cursorPositionRef.current);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    if (isSaving) {
      set(pageHandle);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSaving]);

  const label = <span style={{ color: '#889096' }}>{slug.substring(0, 16)}.../</span>;

  return (
    <div className="input-group col">
      <div className="input-group-text" data-cy={'page-handle-pre-input-section'}>
        <ToolTip label={label} meta={{ tip: slug }} labelClass="page-handle-tip" />
      </div>
      <input
        ref={inputRef}
        type="text"
        className={`page-handler-input  form-control form-control-sm ${error ? 'is-invalid' : ''}`}
        placeholder={'Enter page handle'}
        onChange={onChangePageHandleValue}
        onInput={handleInput}
        value={value}
        data-cy={'page-handle-input-field'}
      />
      <div className="invalid-feedback" data-cy={'page-handle-invalid-feedback'}>
        {error}
      </div>
    </div>
  );
};
