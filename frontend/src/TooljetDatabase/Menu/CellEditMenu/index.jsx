import React, { Children, useState } from 'react';
import Popover from 'react-bootstrap/Popover';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import './styles.scss';

export const CellEditMenu = ({
  darkMode = false,
  children,
  show,
  close,
  columnDetails,
  saveFunction,
  setCellValue,
  cellValue,
  previousCellValue,
  setDefaultValue,
  defaultValue,
  setNullValue,
  nullValue,
}) => {
  const [isBoolean] = useState(false);

  const handleDefaultChange = (defaultColumnValue, defaultBooleanValue) => {
    if (defaultBooleanValue === true) {
      setCellValue(defaultColumnValue);
    } else {
      setCellValue(previousCellValue);
    }
    setDefaultValue(defaultBooleanValue);
  };

  const handleNullChange = (nullVal) => {
    if (nullVal === true) {
      setCellValue(null);
    } else {
      setCellValue(previousCellValue);
    }
    setNullValue(nullVal);
  };

  const popover = (
    <Popover className={`${darkMode && 'dark-theme'} tjdb-table-cell-edit-popover`}>
      <Popover.Body className={`${darkMode && 'dark-theme'}`}>
        <div className={`d-flex flex-column ${isBoolean ? 'gap-4' : 'gap-3'}`}>
          {/*  Boolean View */}
          {isBoolean && (
            <div className="d-flex align-items-start gap-2">
              <span className="d-flex align-items-center gap-2 fw-500 tjdb-bool-cell-menu-badge-default">False</span>
              <span className="d-flex align-items-center gap-2 fw-500 tjdb-bool-cell-menu-badge-default">True</span>
              <span className="d-flex align-items-center gap-2 fw-500 tjdb-bool-cell-menu-badge-default tjdb-bool-cell-menu-badge-selected">
                Null
              </span>
            </div>
          )}

          {!isBoolean && (
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex flex-column align-items-start gap-1">
                <div className="d-flex align-items-center gap-1">
                  <div className="fw-500 tjdb-cell-menu-shortcuts-info">
                    <SolidIcon name="enterbutton" />
                  </div>
                  <div className="fw-400 tjdb-cell-menu-shortcuts-text">Save Changes</div>
                </div>
                <div className="d-flex align-items-center gap-1">
                  <div className="fw-500 tjdb-cell-menu-shortcuts-info">Esc</div>
                  <div className="fw-400 tjdb-cell-menu-shortcuts-text">Discard Changes</div>
                </div>
              </div>
              <div className="d-flex flex-column align-items-end gap-1">
                {columnDetails?.constraints_type.is_not_null === false && (
                  <div className="d-flex align-items-center gap-2">
                    <div className="d-flex flex-column">
                      <span className="fw-400 fs-12">Set to null</span>
                    </div>
                    <div>
                      <label className={`form-switch`}>
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={nullValue}
                          onChange={() => handleNullChange(!nullValue)}
                        />
                      </label>
                    </div>
                  </div>
                )}
                {columnDetails?.column_default !== null && (
                  <div className="d-flex align-items-center gap-2">
                    <div className="d-flex flex-column">
                      <span className="fw-400 fs-12">Set to default</span>
                    </div>
                    <div>
                      <label className={`form-switch`}>
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={defaultValue}
                          onChange={() => handleDefaultChange(columnDetails?.column_default, !defaultValue)}
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="d-flex justify-content-end align-items-end gap-2">
            <ButtonSolid onClick={close} variant="tertiary" size="sm">
              Cancel
            </ButtonSolid>
            <ButtonSolid
              onClick={saveFunction}
              disabled={cellValue == previousCellValue ? true : false}
              variant="primary"
              size="sm"
            >
              Save
            </ButtonSolid>
          </div>
        </div>
      </Popover.Body>
    </Popover>
  );

  return (
    <OverlayTrigger show={show} trigger="click" placement="bottom" rootclose overlay={popover} defaultShow>
      {children}
    </OverlayTrigger>
  );
};
