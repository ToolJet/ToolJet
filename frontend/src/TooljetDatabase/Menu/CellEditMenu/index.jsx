import React, { useEffect, useState } from 'react';
import Popover from 'react-bootstrap/Popover';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import LeftNav from '../../Icons/LeftNav.svg';
import RightNav from '../../Icons/RightNav.svg';
import cx from 'classnames';
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
  isBoolean,
}) => {
  // below state is used only for boolean cell
  const [selectedValue, setSelectedValue] = useState(cellValue);

  const handleDefaultChange = (defaultColumnValue, defaultBooleanValue) => {
    if (defaultBooleanValue === true) {
      setCellValue(defaultColumnValue);
    } else {
      setCellValue(previousCellValue);
    }
    setDefaultValue(defaultBooleanValue);
    setNullValue(false);
  };

  const handleNullChange = (nullVal) => {
    if (nullVal === true) {
      setCellValue(null);
    } else {
      if (previousCellValue === null) {
        setCellValue('');
      } else {
        setCellValue(previousCellValue);
      }
    }
    setNullValue(nullVal);
    setDefaultValue(false);
  };

  const handleSelectedState = (value) => {
    setSelectedValue(value);
    setCellValue(value);
  };

  const closePopover = () => {
    setSelectedValue(previousCellValue);
    close();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowRight' && isBoolean) {
      e.preventDefault();
      if (selectedValue === false) handleSelectedState(true);
      if (selectedValue === true) handleSelectedState(null);
    }

    if (e.key === 'ArrowLeft' && isBoolean) {
      e.preventDefault();
      if (selectedValue === null) handleSelectedState(true);
      if (selectedValue === true) handleSelectedState(false);
    }

    if (e.key === 'Escape') {
      closePopover();
    }

    if (e.key === 'Enter' && cellValue !== previousCellValue && show) {
      saveFunction(cellValue);
    }

    if (e.key === 'Backspace') {
      if (selectedValue === null) {
        if (isBoolean) {
          setSelectedValue(true);
          setCellValue(true);
        } else {
          setSelectedValue('');
          setCellValue('');
        }
        setNullValue(false);
        setDefaultValue(false);
        document.getElementById('edit-input-blur').focus();
      }
    }
    e.stopPropagation();
  };

  useEffect(() => {
    if (show) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [show, isBoolean, selectedValue, cellValue]);

  useEffect(() => {
    if (selectedValue !== cellValue) setSelectedValue(cellValue);
  }, [cellValue]);

  const popover = (
    <Popover className={`${darkMode && 'dark-theme'} tjdb-table-cell-edit-popover`}>
      <Popover.Body className={`${darkMode && 'dark-theme'}`}>
        <div className={`d-flex flex-column ${isBoolean ? 'gap-4' : 'gap-3'}`}>
          {/*  Boolean View */}
          {isBoolean && (
            <div className="d-flex align-items-start gap-2">
              <span
                className={`boolean-state-${
                  selectedValue === false ? 'selected' : ''
                } d-flex align-items-center gap-2 fw-500 tjdb-bool-cell-menu-badge-default`}
                tabIndex="0"
                onClick={() => handleSelectedState(false)}
              >
                False
              </span>
              <span
                className={`boolean-state-${
                  selectedValue === true ? 'selected' : ''
                } d-flex align-items-center gap-2 fw-500 tjdb-bool-cell-menu-badge-default`}
                tabIndex="1"
                onClick={() => handleSelectedState(true)}
              >
                True
              </span>
              {columnDetails?.constraints_type.is_not_null === false && (
                <span
                  className={`boolean-state-${
                    selectedValue === null ? 'selected' : ''
                  } d-flex align-items-center gap-2 fw-500 tjdb-bool-cell-menu-badge-default`}
                  tabIndex="2"
                  onClick={() => handleSelectedState(null)}
                >
                  Null
                </span>
              )}
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
          <div
            className={cx('d-flex align-items-center gap-2', {
              'justify-content-between': isBoolean,
              'justify-content-end': !isBoolean,
            })}
          >
            {isBoolean ? (
              <div className="cell-editmenu-keyActions">
                <div className="leftNav-parent-container">
                  <LeftNav style={{ verticalAlign: 'baseline' }} width={8} height={8} />
                </div>
                <div className="rightNav-parent-container">
                  <RightNav style={{ verticalAlign: 'baseline' }} width={8} height={8} />
                </div>
                <div className="navigate-title fs-10">Navigate</div>
              </div>
            ) : null}
            <div className="d-flex" style={{ gap: '8px' }}>
              <ButtonSolid onClick={closePopover} variant="tertiary" size="sm" className="fs-12">
                Cancel
              </ButtonSolid>
              <ButtonSolid
                onClick={() => saveFunction(selectedValue)}
                disabled={cellValue == previousCellValue ? true : false}
                variant="primary"
                size="sm"
                className="fs-12"
              >
                Save
              </ButtonSolid>
            </div>
          </div>
        </div>
      </Popover.Body>
    </Popover>
  );

  return (
    <OverlayTrigger show={show} trigger="click" placement="bottom-start" rootclose overlay={popover} defaultShow>
      {children}
    </OverlayTrigger>
  );
};
