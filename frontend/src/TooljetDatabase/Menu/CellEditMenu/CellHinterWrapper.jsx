import React, { useRef, useState } from 'react';
import CodeHinter from '@/AppBuilder/CodeEditor';
import { resolveReferences } from '@/AppBuilder/CodeEditor/utils';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import cx from 'classnames';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { Popover } from 'react-bootstrap';
import _ from 'lodash';

const transformvalue = (value = '') => {
  if (typeof value !== 'string') {
    return JSON.stringify(value);
  }
  return value;
};

export const CellHinterWrapper = ({
  isNotNull,
  defaultValue,
  selectedValue,
  setSelectedValue,
  saveFunction,
  isEditCell,
  columnDetails,
  close,
  closePopover,
  show,
  previousCellValue,
}) => {
  const initialValueRef = useRef(selectedValue);

  const defaultValueRef = useRef(defaultValue);

  const [shouldUpdateToDefaultVal, setShouldUpdateDefaultVal] = useState(false);

  const [shouldUpdateToNullVal, setShouldUpdateNullVal] = useState(false);

  const [disabledSaveButton, setDisabledSaveButton] = useState(false);

  const handleInputError = (bool = false) => {
    setDisabledSaveButton(bool);
  };

  const handleKeyDown = (e) => {
    e.stopPropagation();

    if (e.key === 'Escape') {
      const event = new Event('click', { bubbles: true, cancelable: true });
      document.body.dispatchEvent(event);
    }
  };
  const darkMode = localStorage.getItem('darkMode') === 'true';

  const tranformedValue = (rawValue) => {
    if (!rawValue) {
      return JSON.stringify(rawValue);
    }
    const [_, __, resolvedValue] = resolveReferences(`{{${rawValue}}}`);
    return resolvedValue;
  };

  const SaveChangesSection = () => {
    const handleNullToggle = (value) => {
      setShouldUpdateNullVal(false);

      if (value) {
        setSelectedValue(null);
        shouldUpdateToDefaultVal && setShouldUpdateDefaultVal(false);
      } else {
        setSelectedValue(tranformedValue(previousCellValue));
      }
      setShouldUpdateNullVal(value);
    };

    const handleDefaultToggle = (value) => {
      setShouldUpdateDefaultVal(false);

      if (value) {
        setSelectedValue(defaultValue);
        shouldUpdateToNullVal && setShouldUpdateNullVal(false);
        defaultValueRef.current = defaultValue;
      } else {
        const val = tranformedValue(previousCellValue);
        defaultValueRef.current = val;
        setSelectedValue(val);
      }
      setShouldUpdateDefaultVal(true);
    };

    return (
      <div className="d-flex justify-content-between align-items-center">
        <div className="d-flex flex-column align-items-start gap-1">
          {
            <div className="d-flex align-items-center gap-1">
              <div className={`fw-500 tjdbCellMenuShortcutsInfo`} id="enterbutton">
                <SolidIcon name="enterbutton" />
              </div>
              <div className={`fw-400 tjdbCellMenuShortcutsText`}>Press Enter to go on next line</div>
            </div>
          }
          <div className="d-flex align-items-center gap-1">
            <div className={`fw-500 tjdbCellMenuShortcutsInfo`} id="escbutton">
              Esc
            </div>
            <div className={`fw-400 tjdbCellMenuShortcutsText`}>Discard Changes</div>
          </div>
        </div>
        <div className="d-flex flex-column align-items-end gap-1">
          {isNotNull === false && (
            <div className="d-flex align-items-center gap-2">
              <div className="d-flex flex-column">
                <span style={{ width: 'auto' }} className="fw-400 fs-12">
                  Set to null
                </span>
              </div>
              <div>
                <label className={`form-switch`}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={selectedValue === null}
                    onChange={(e) => handleNullToggle(e.target.checked)}
                  />
                </label>
              </div>
            </div>
          )}

          {defaultValue !== null && (
            <div className="d-flex align-items-center gap-2">
              <div className="d-flex flex-column">
                <span style={{ width: 'auto' }} className="fw-400 fs-12">
                  Set to default
                </span>
              </div>
              <div>
                <label className={`form-switch`}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={_.isEqual(selectedValue, defaultValue)}
                    onChange={(e) => handleDefaultToggle(e.target.checked)}
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleCancel = () => {
    const event = new Event('click', { bubbles: true, cancelable: true });
    document.body.dispatchEvent(event);
    setShouldUpdateDefaultVal(false);
    setShouldUpdateNullVal(false);
  };

  const handleSave = (e) => {
    if (e) {
      e.stopPropagation();
    }
    saveFunction(selectedValue);
    const event = new Event('click', { bubbles: true, cancelable: true });
    document.body.dispatchEvent(event);
    setShouldUpdateDefaultVal(false);
    setShouldUpdateNullVal(false);
    defaultValueRef.current = defaultValue;
  };

  const SaveChangesFooter = () => {
    return (
      <div className={cx('d-flex align-items-center', 'justify-content-end')}>
        <div className="d-flex" style={{ gap: '8px' }}>
          <ButtonSolid onClick={handleCancel} variant="tertiary" size="sm" className="fs-12 p-2">
            Cancel
          </ButtonSolid>
          <ButtonSolid
            onClick={(e) => handleSave(e)}
            disabled={disabledSaveButton}
            variant="primary"
            size="sm"
            className="fs-12 p-2"
          >
            Save
          </ButtonSolid>
        </div>
      </div>
    );
  };
  const popover = (
    <Popover className={`${darkMode && 'dark-theme'} tjdb-table-cell-edit-popover jsonb-popover`}>
      {disabledSaveButton && (
        <Popover.Header className="tjdb-cell-hinter-invalid-syntax-header">
          <div className="d-flex align-items-center">
            <span className="d-flex mx-2">
              {' '}
              <SolidIcon name="warning" width="16px" fill={'var(--tomato9)'} />
            </span>
            <span>Invalid JSON syntax</span>
          </div>
        </Popover.Header>
      )}
      <Popover.Body className={`${darkMode && 'dark-theme'}`} onClick={(e) => e.stopPropagation()}>
        <div className={`d-flex flex-column gap-3`}>
          <SaveChangesSection />
          <SaveChangesFooter />
        </div>
      </Popover.Body>
    </Popover>
  );

  const customFooter = () => {
    return (
      <div
        className={`tjdb-dashboard-codehinter custom-footer ${darkMode && 'dark-theme'} `}
        tabIndex="0"
        onClick={(e) => e.stopPropagation()}
      >
        {disabledSaveButton && (
          <div className="tjdb-cell-hinter-invalid-syntax-header">
            <div className="d-flex align-items-center">
              <span className="d-flex mx-2">
                {' '}
                <SolidIcon name="warning" width="16px" fill={'var(--tomato9)'} />
              </span>
              <span>Invalid JSON syntax</span>
            </div>
          </div>
        )}
        <div className="main-body d-flex flex-column gap-3">
          <SaveChangesSection />
          <SaveChangesFooter />
        </div>
      </div>
    );
  };

  return (
    <OverlayTrigger trigger="click" placement="bottom-start" rootclose overlay={popover}>
      <div className="tjdb-dashboard-codehinter-wrapper-cell" onKeyDown={handleKeyDown}>
        <CodeHinter
          type="tjdbHinter"
          inEditor={false}
          initialValue={initialValueRef.current ? transformvalue(initialValueRef.current) : ''}
          lang="javascript"
          onChange={(value) => {
            const [_, __, resolvedValue] = resolveReferences(`{{${value}}}`);
            setSelectedValue(resolvedValue);
          }}
          enablePreview={false}
          footerComponent={customFooter}
          componentName={`{} ${columnDetails.Header}`}
          errorCallback={handleInputError}
          defaultValue={defaultValueRef.current}
          reset={shouldUpdateToDefaultVal}
          shouldUpdateToNullVal={shouldUpdateToNullVal}
          columnName={columnDetails?.Header}
        />
      </div>
    </OverlayTrigger>
  );
};
