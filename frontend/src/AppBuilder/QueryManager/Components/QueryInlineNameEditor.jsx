import React, { useEffect, useRef, useState } from 'react';
import OverflowTooltip from '@/_components/OverflowTooltip';
import { Check, PencilLine, X } from 'lucide-react';
import { QueryDocumentationLink } from './QueryDocumentationLink';
import {
  EDIT_APP_NAME_ICON_PROPS,
  EDIT_ICON_REVEAL_CLASS,
  INLINE_RENAME_ACTIONS_CLASS,
  INLINE_RENAME_ACTIONS_EXIT_CLASS,
  INLINE_RENAME_ACTION_CLASS,
  INLINE_RENAME_INPUT_CLASS,
  INLINE_RENAME_SAVE_COLOR_CLASS,
  INLINE_RENAME_TRANSITION_MS,
  INLINE_RENAME_TRIGGER_CLASS,
} from '@/AppBuilder/Header/EditAppName.utils';
import {
  getInlineQueryNameCursorPosition,
  getInlineQueryNameStyle,
  getQueryDocumentationPresentation,
  normalizeQueryName,
  validateInlineQueryName,
} from './QueryRename.utils';

export const QueryInlineNameEditor = ({ value, isEditing, onEditingChange, onSave, disabled, queryDocumentation }) => {
  const [draftName, setDraftName] = useState(value);
  const [errorText, setErrorText] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const inputRef = useRef(null);
  const exitTimeoutRef = useRef(null);
  // Set the moment editing starts to close, so a blur from the same action can't save a second time.
  const isClosingRef = useRef(false);

  useEffect(() => {
    if (!isEditing) setDraftName(value);
  }, [isEditing, value]);

  useEffect(() => () => window.clearTimeout(exitTimeoutRef.current), []);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      const cursorPosition = getInlineQueryNameCursorPosition(value);
      inputRef.current.focus();
      inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
    }
  }, [isEditing, value]);

  const startEditing = () => {
    if (disabled) return;
    setDraftName(value);
    setErrorText('');
    setIsClosing(false);
    isClosingRef.current = false;
    onEditingChange(true);
  };

  const closeWithAnimation = () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    setIsClosing(true);
    exitTimeoutRef.current = window.setTimeout(() => {
      setErrorText('');
      setIsClosing(false);
      isClosingRef.current = false;
      onEditingChange(false);
    }, INLINE_RENAME_TRANSITION_MS);
  };

  const handleSave = () => {
    if (isClosingRef.current) return;
    const nextName = normalizeQueryName(draftName);
    const validation = validateInlineQueryName(nextName);
    setDraftName(nextName);
    setErrorText(validation.errorMsg);
    if (validation.errorMsg) return;
    if (nextName === value) return closeWithAnimation();

    const saveError = onSave(nextName);
    if (saveError) {
      setErrorText(saveError);
      return;
    }
    closeWithAnimation();
  };

  // Clicking anywhere outside ends editing like Enter, except that a name that can't be saved (empty,
  // or rejected by onSave) is dropped instead of keeping the editor open.
  const handleBlur = () => {
    if (isClosingRef.current) return;
    const nextName = normalizeQueryName(draftName);
    const saveError = validateInlineQueryName(nextName).errorMsg || (nextName !== value ? onSave(nextName) : '');
    if (saveError) setDraftName(value);
    closeWithAnimation();
  };

  // Keeps focus in the input, so pressing save or cancel never counts as a click outside.
  const keepInputFocus = (event) => event.preventDefault();

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSave();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeWithAnimation();
    }
  };

  return (
    <div className="query-inline-name-shell">
      {isEditing ? (
        <div className="query-inline-name-editor">
          <input
            ref={inputRef}
            type="text"
            value={draftName}
            onChange={(event) => {
              const nextName = event.target.value;
              setDraftName(nextName);
              setErrorText(validateInlineQueryName(nextName).errorMsg);
            }}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            disabled={isClosing}
            aria-label="Query name"
            aria-invalid={!!errorText}
            data-cy="query-rename-input"
            className={`${INLINE_RENAME_INPUT_CLASS} query-inline-name-input`}
            style={getInlineQueryNameStyle()}
          />
          <span className={`${INLINE_RENAME_ACTIONS_CLASS} ${isClosing ? INLINE_RENAME_ACTIONS_EXIT_CLASS : ''}`}>
            <button
              type="button"
              className={`query-inline-name-action ${INLINE_RENAME_ACTION_CLASS} ${INLINE_RENAME_SAVE_COLOR_CLASS}`}
              onMouseDown={keepInputFocus}
              onClick={handleSave}
              disabled={isClosing || !!errorText}
              aria-label="Save query name"
            >
              <Check size={13} />
            </button>
            <button
              type="button"
              className={`query-inline-name-action ${INLINE_RENAME_ACTION_CLASS} tw-text-[var(--icon-danger)]`}
              onMouseDown={keepInputFocus}
              onClick={closeWithAnimation}
              disabled={isClosing}
              aria-label="Cancel query rename"
            >
              <X size={14} />
            </button>
          </span>
          {errorText && (
            <span className="query-inline-name-error" role="alert">
              {errorText}
            </span>
          )}
        </div>
      ) : (
        <button
          className={`${INLINE_RENAME_TRIGGER_CLASS} query-inline-name-trigger`}
          type="button"
          onClick={startEditing}
          disabled={disabled}
          aria-label="Rename query"
        >
          <OverflowTooltip
            placement="bottom"
            childrenClassName="tw-block tw-min-w-0 tw-max-w-[25ch] tw-text-start tw-text-[var(--text-default)]"
            data-cy="query-name-label"
          >
            {value}
          </OverflowTooltip>
          {!disabled && (
            <span className={EDIT_ICON_REVEAL_CLASS}>
              <PencilLine {...EDIT_APP_NAME_ICON_PROPS} className="tw-text-[var(--icon-default)]" />
            </span>
          )}
        </button>
      )}
      {queryDocumentation && (
        <QueryDocumentationLink {...queryDocumentation} {...getQueryDocumentationPresentation()} />
      )}
    </div>
  );
};
