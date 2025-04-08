import React, { useState, useEffect, useRef } from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { determineJustifyContentValue } from '@/_helpers/utils';
import { default as ReactMarkdown } from 'react-markdown';
import useTextColor from '../DataTypes/_hooks/useTextColor';
import useTableStore from '../../_stores/tableStore';
import { getMaxHeight } from '../../_utils/helper';
import { shallow } from 'zustand/shallow';
import DOMPurify from 'dompurify';

export const MarkdownColumn = ({
  id,
  isEditable,
  darkMode,
  handleCellValueChange,
  textColor,
  cellValue,
  column,
  containerWidth,
  cell,
  horizontalAlignment,
  cellSize,
}) => {
  const ref = useRef(null);
  const cellTextColor = useTextColor(id, textColor);
  const isMaxRowHeightAuto = useTableStore((state) => state.getTableStyles(id)?.isMaxRowHeightAuto, shallow);
  const maxRowHeightValue = useTableStore((state) => state.getTableStyles(id)?.maxRowHeightValue, shallow);
  const [hovered, setHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const cellStyles = {
    color: cellTextColor ?? 'inherit',
  };

  const getCellValue = (value) => {
    let transformedValue = value;
    if (typeof value !== 'string') {
      try {
        transformedValue = String(value);
      } catch (e) {
        transformedValue = '';
      }
    }
    return DOMPurify.sanitize(transformedValue.trim());
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
        const value = e.target.textContent;
        handleCellValueChange(cell.row.index, column.key || column.name, value, cell.row.original);
      }
    };

    return (
      <div
        ref={ref}
        contentEditable={'true'}
        className={`h-100 text-container long-text-input d-flex${
          darkMode ? ' textarea-dark-theme' : ''
        } justify-content-${determineJustifyContentValue(horizontalAlignment)}`}
        style={{
          color: cellTextColor ? cellTextColor : 'inherit',
          outline: 'none',
          border: 'none',
          background: 'inherit',
          position: 'relative',
          height: '100%',
          flexDirection: 'column',
        }}
        readOnly={!isEditable}
        onBlur={(e) => {
          setIsEditing(false);
          onChange(e);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            ref.current.blur();
            onChange(e);
          }
        }}
        onFocus={(e) => {
          setIsEditing(true);
          e.stopPropagation();
        }}
      >
        <div>{isEditing ? cellValue : <ReactMarkdown>{getCellValue(cellValue)}</ReactMarkdown>}</div>
      </div>
    );
  };

  const _showOverlay =
    ref?.current &&
    (ref?.current?.clientWidth < ref?.current?.children[0]?.offsetWidth ||
      ref?.current?.clientHeight < ref?.current?.children[0]?.offsetHeight);

  return (
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
              maxHeight: getMaxHeight(isMaxRowHeightAuto, maxRowHeightValue, cellSize),
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
  );
};
