import React, { useState, useEffect } from 'react';
import { resolveReferences, validateWidget, determineJustifyContentValue } from '@/_helpers/utils';
import DOMPurify from 'dompurify';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';

const Text = ({
  isEditable,
  darkMode,
  handleCellValueChange,
  cellTextColor,
  horizontalAlignment,
  cellValue,
  column,
  currentState,
  containerWidth,
  cell,
}) => {
  const validationData = validateWidget({
    validationObject: {
      minLength: {
        value: column.minLength,
      },
      maxLength: {
        value: column.maxLength,
      },
      customRule: {
        value: column.customRule,
      },
    },
    widgetValue: cellValue,
    currentState,
    customResolveObjects: { cellValue },
  });
  const { isValid, validationError } = validationData;
  const elem = document.querySelector('.table-text-column-cell');
  const [showOverlay, setShowOverlay] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [contentEditable, setContentEditable] = useState(false);

  useEffect(() => {
    if (hovered) {
      setShowOverlay(true);
    } else {
      setShowOverlay(false);
    }
  }, [hovered]);

  const _renderTextArea = () => (
    <p
      contentEditable={contentEditable}
      className={`${!isValid ? 'is-invalid' : ''} h-100 long-text-input text-container ${
        darkMode ? ' textarea-dark-theme' : ''
      }`}
      style={{
        color: cellTextColor ? cellTextColor : 'inherit',
        maxWidth: containerWidth,
        outline: 'none',
        border: 'none',
        background: 'inherit',
        overflowY: 'auto',
        whiteSpace: 'pre-wrap',
      }}
      readOnly={!isEditable}
      onBlur={(e) => {
        if (isEditable && cellValue !== e.target.textContent) {
          const div = e.target;
          let content = div.innerHTML;
          console.log({ content }, 'content');
          handleCellValueChange(cell.row.index, column.key || column.name, content, cell.row.original);
        }
      }}
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(cellValue) }}
      onKeyDown={(e) => {
        e.persist();
        if (e.key === 'Enter' && !e.shiftKey && isEditable) {
          const div = e.target;
          let content = div.innerHTML;
          handleCellValueChange(cell.row.index, column.key || column.name, content, cell.row.original);
        }
      }}
      onFocus={(e) => {
        setShowOverlay(false);
        e.stopPropagation();
      }}
      onClick={(e) => {
        setContentEditable(true);
      }}
      // defaultValue={cellValue}
    />
  );

  const getOverlay = () => {
    return (
      <div
        style={{
          maxWidth: containerWidth,
          width: containerWidth,
        }}
        className={`overlay-cell-table ${darkMode && 'dark-theme'}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(cellValue) }}
        style={{ whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}
      />
    );
  };
  return (
    <>
      <OverlayTrigger
        placement="bottom"
        overlay={elem && elem?.parentElement?.clientHeight < elem?.scrollHeight ? getOverlay() : <div></div>}
        trigger={elem && elem?.parentElement?.clientHeight < elem?.scrollHeight && ['hover']}
        rootClose={true}
        show={elem && elem?.parentElement?.clientHeight < elem?.scrollHeight && showOverlay}
      >
        <div className="h-100 d-flex flex-column justify-content-center position-relative">
          <div
            className="table-text-column-cell"
            onMouseMove={() => {
              if (!hovered) setHovered(true);
            }}
            onMouseOut={() => setHovered(false)}
          >
            <div>{_renderTextArea()}</div>
          </div>
          <div className={isValid ? '' : 'invalid-feedback'}>{validationError}</div>
        </div>
      </OverlayTrigger>
    </>
  );
};

export default Text;
