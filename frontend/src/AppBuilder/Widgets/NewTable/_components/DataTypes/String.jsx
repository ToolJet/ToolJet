import React, { useState, useEffect, useRef } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { determineJustifyContentValue } from '@/_helpers/utils';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import useTableStore from '@/AppBuilder/Widgets/NewTable/_stores/tableStore';
import HighLightSearch from '@/AppBuilder/Widgets/NewTable/_components/HighLightSearch';
import { getMaxHeight } from '../../_utils/helper';

export const StringColumn = ({
  isEditable,
  darkMode,
  handleCellValueChange,
  cellTextColor,
  horizontalAlignment,
  cellValue,
  column,
  containerWidth,
  cell,
  row,
  searchText,
  id,
}) => {
  const validateWidget = useStore((state) => state.validateWidget, shallow);

  const cellHeight = useTableStore((state) => state.getTableStyles(id)?.cellHeight, shallow);
  const isMaxRowHeightAuto = useTableStore((state) => state.getTableStyles(id)?.isMaxRowHeightAuto, shallow);
  const maxRowHeightValue = useTableStore((state) => state.getTableStyles(id)?.maxRowHeightValue, shallow);

  const ref = useRef(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const validationData = validateWidget({
    validationObject: {
      regex: { value: column.regex },
      minLength: { value: column.minLength },
      maxLength: { value: column.maxLength },
      customRule: { value: column.customRule },
    },
    widgetValue: cellValue,
    customResolveObjects: { cellValue },
  });
  const { isValid, validationError } = validationData;

  useEffect(() => {
    setShowOverlay(hovered);
  }, [hovered]);

  useEffect(() => {
    if (!isEditable && isEditing) {
      setIsEditing(false);
    }
  }, [isEditable, isEditing]);

  const getOverlay = () => (
    <div
      className={`overlay-cell-table ${darkMode ? 'dark-theme' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ color: 'var(--text-primary)' }}
    >
      <span style={{ width: `${containerWidth}px` }}>{String(cellValue)}</span>
    </div>
  );

  const _showOverlay =
    ref?.current &&
    (ref?.current?.clientWidth < ref?.current?.children[0]?.offsetWidth ||
      ref?.current?.clientHeight < ref?.current?.children[0]?.offsetHeight);

  const focusInput = () => {
    if (ref.current) {
      ref.current.focus();
    }
  };

  const renderEditableContent = () => (
    <div className="h-100 d-flex flex-column justify-content-center position-relative">
      <div
        onMouseMove={() => !hovered && setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`${!isValid ? 'is-invalid h-100' : ''} ${isEditing ? 'h-100 content-editing' : ''} h-100`}
      >
        <div
          ref={ref}
          contentEditable={true}
          className={`${!isValid ? 'is-invalid' : ''} h-100 text-container long-text-input d-flex align-items-center ${
            darkMode ? 'textarea-dark-theme' : ''
          } justify-content-${determineJustifyContentValue(horizontalAlignment)}`}
          style={{
            color: cellTextColor || 'inherit',
            outline: 'none',
            border: 'none',
            background: 'inherit',
            position: 'relative',
            height: '100%',
          }}
          onBlur={(e) => {
            setIsEditing(false);
            if (cellValue !== e.target.textContent) {
              handleCellValueChange(row.index, column.key || column.name, e.target.textContent, row.original);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.target.blur();
            }
          }}
          onFocus={(e) => {
            setIsEditing(true);
            e.stopPropagation();
          }}
          suppressContentEditableWarning={true}
        >
          <HighLightSearch text={String(cellValue)} searchTerm={searchText} />
        </div>
      </div>
      {!isValid && (
        <div className="invalid-feedback text-truncate" onClick={focusInput}>
          {validationError}
        </div>
      )}
    </div>
  );

  const renderReadOnlyContent = () => (
    <div
      className={`d-flex align-items-center h-100 w-100 justify-content-${determineJustifyContentValue(
        horizontalAlignment
      )}`}
      style={{ color: cellTextColor || 'inherit' }}
      onMouseMove={() => !hovered && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      ref={ref}
    >
      <span
        style={{
          maxHeight: getMaxHeight(isMaxRowHeightAuto, maxRowHeightValue, cellHeight),
        }}
      >
        <HighLightSearch text={String(cellValue)} searchTerm={searchText} />
      </span>
    </div>
  );

  return (
    <OverlayTrigger
      placement="bottom"
      overlay={_showOverlay ? getOverlay() : <div />}
      trigger={_showOverlay && ['hover', 'focus']}
      rootClose={true}
      show={_showOverlay && showOverlay && !isEditing}
    >
      {isEditable ? renderEditableContent() : renderReadOnlyContent()}
    </OverlayTrigger>
  );
};
