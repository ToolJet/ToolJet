import React, { useState, useEffect } from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { determineJustifyContentValue } from '@/_helpers/utils';
import { default as ReactMarkdown } from 'react-markdown';
import DOMPurify from 'dompurify';

const Markdown = ({
  isEditable,
  darkMode,
  handleCellValueChange,
  cellTextColor,
  cellValue,
  column,
  containerWidth,
  cell,
  horizontalAlignment,
  isMaxRowHeightAuto,
  cellSize,
  maxRowHeightValue,
}) => {
  const ref = React.useRef(null);

  const [hovered, setHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const cellStyles = {
    color: cellTextColor ?? 'inherit',
  };

  const getCellValue = (value) => {
    return DOMPurify.sanitize(value);
  };

  useEffect(() => {
    if (!isEditable && isEditing) {
      setIsEditing(false);
    }
  }, [isEditable]);

  const getOverlay = () => {
    return (
      <div
        className={`overlay-cell-table ${darkMode && 'dark-theme'}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ color: 'var(--text-primary)' }}
      >
        <span
          style={{
            width: `${containerWidth}px`,
            whiteSpace: 'pre-wrap',
          }}
        >
          <ReactMarkdown>{getCellValue(cellValue)}</ReactMarkdown>
        </span>
      </div>
    );
  };

  const renderEditable = () => {
    const onChange = (e) => {
      if (cellValue !== e.target.textContent) {
        const value = e.target.textContent.replace(/\n/g, '');
        handleCellValueChange(cell.row.index, column.key || column.name, value, cell.row.original);
      }
    };

    return (
      <div
        ref={ref}
        contentEditable={'true'}
        className={`h-100 text-container long-text-input d-flex align-items-center ${
          darkMode ? ' textarea-dark-theme' : ''
        } justify-content-${determineJustifyContentValue(horizontalAlignment)}`}
        tabIndex={-1}
        style={{
          color: cellTextColor ? cellTextColor : 'inherit',
          outline: 'none',
          border: 'none',
          background: 'inherit',
          position: 'relative',
          height: '100%',
        }}
        readOnly={!isEditable}
        onBlur={(e) => {
          setIsEditing(false);
          onChange(e);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            ref.current.blur();
            onChange(e);
          }
        }}
        onFocus={(e) => {
          setIsEditing(true);
          e.stopPropagation();
        }}
      >
        {isEditing ? cellValue : <ReactMarkdown>{getCellValue(cellValue)}</ReactMarkdown>}
      </div>
    );
  };

  const _showOverlay =
    ref?.current &&
    (ref?.current?.clientWidth < ref?.current?.children[0]?.offsetWidth ||
      ref?.current?.clientHeight < ref?.current?.children[0]?.offsetHeight);

  return (
    <>
      <OverlayTrigger
        placement="bottom"
        overlay={_showOverlay ? getOverlay() : <div></div>}
        trigger={_showOverlay && ['hover', 'focus']}
        rootClose={true}
        show={_showOverlay && hovered && !isEditing}
      >
        {!isEditable ? (
          <div
            className={`d-flex align-items-center h-100 w-100 justify-content-${determineJustifyContentValue(
              horizontalAlignment
            )}`}
            style={cellStyles}
            onMouseMove={() => {
              if (!hovered) setHovered(true);
            }}
            onMouseLeave={() => {
              setHovered(false);
            }}
            ref={ref}
          >
            <span
              style={{
                maxHeight: isMaxRowHeightAuto
                  ? 'fit-content'
                  : maxRowHeightValue
                  ? `${maxRowHeightValue}px`
                  : cellSize === 'condensed'
                  ? '39px'
                  : '45px',
                whiteSpace: 'pre-wrap',
              }}
            >
              <ReactMarkdown>{getCellValue(cellValue)}</ReactMarkdown>
            </span>
          </div>
        ) : (
          <div className="h-100 d-flex flex-column justify-content-center position-relative">
            <div
              onMouseMove={() => {
                if (!hovered) setHovered(true);
              }}
              onMouseLeave={() => setHovered(false)}
              className={`${isEditing ? 'h-100 content-editing' : ''} h-100`}
            >
              {renderEditable()}
            </div>
          </div>
        )}
      </OverlayTrigger>
    </>
  );
};

export default Markdown;
