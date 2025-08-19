import React, { useState, useRef, useEffect } from 'react';
import cx from 'classnames';
import './styles.scss';

const InlineEdit = ({
  value = '',
  onSave,
  onCancel,
  placeholder = 'Click to edit',
  disabled = false,
  readOnly = false,
  className = '',
  inputClassName = '',
  textClassName = '',
  multiline = false,
  maxLength,
  minLength,
  required = false,
  autoFocus = false,
  validation,
  ...props
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [error, setError] = useState('');
  const [textWidth, setTextWidth] = useState(0);
  const inputRef = useRef(null);
  const textRef = useRef(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleEdit = () => {
    if (disabled || readOnly) return;

    // Measure text width before transitioning
    if (textRef.current) {
      const width = textRef.current.offsetWidth;
      setTextWidth(width);
    }

    setIsEditing(true);
    setEditValue(value);
    setError('');

    // Focus the input after a small delay to ensure it's rendered
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 50);
  };

  const validateInput = (inputValue) => {
    if (required && !inputValue.trim()) {
      return 'This field is required';
    }
    if (minLength && inputValue.length < minLength) {
      return `Minimum ${minLength} characters required`;
    }
    if (maxLength && inputValue.length > maxLength) {
      return `Maximum ${maxLength} characters allowed`;
    }
    if (validation) {
      return validation(inputValue);
    }
    return '';
  };

  const handleSave = () => {
    const validationError = validateInput(editValue);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (onSave) {
      onSave(editValue);
    }
    setIsEditing(false);
    setError('');
  };

  const handleCancel = () => {
    setEditValue(value);
    setError('');
    setIsEditing(false);
    if (onCancel) {
      onCancel();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleBlur = () => {
    if (isEditing) {
      handleSave();
    }
  };

  const renderText = () => (
    <div
      ref={textRef}
      className={cx(
        'inline-edit-text',
        {
          'inline-edit-text--empty': !value,
          'inline-edit-text--disabled': disabled,
          'inline-edit-text--readonly': readOnly,
        },
        textClassName
      )}
      onClick={handleEdit}
      {...props}
    >
      {value || placeholder}
    </div>
  );

  const renderInput = () => {
    const InputComponent = multiline ? 'textarea' : 'input';
    const inputProps = multiline ? {} : { type: 'text' };

    return (
      <div className="inline-edit-input-wrapper">
        <InputComponent
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className={cx(
            'inline-edit-input',
            {
              'inline-edit-input--error': error,
              'inline-edit-input--multiline': multiline,
            },
            inputClassName
          )}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          minLength={minLength}
          required={required}
          autoFocus={autoFocus}
          {...inputProps}
        />
        {error && <div className="inline-edit-error">{error}</div>}
      </div>
    );
  };

  return (
    <div
      className={cx(
        'inline-edit',
        {
          'inline-edit--editing': isEditing,
          'inline-edit--disabled': disabled,
          'inline-edit--readonly': readOnly,
        },
        className
      )}
      style={isEditing ? { '--text-width': `${textWidth}px` } : {}}
    >
      {renderText()}
      {renderInput()}
    </div>
  );
};

export default InlineEdit;
