import React, { useEffect, useState, useContext } from 'react';
import Popover from 'react-bootstrap/Popover';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import DropDownSelect from '@/Editor/QueryManager/QueryEditors/TooljetDatabase/DropDownSelect';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import Information from '@/_ui/Icon/solidIcons/Information';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import LeftNav from '../../Icons/LeftNav.svg';
import RightNav from '../../Icons/RightNav.svg';
import cx from 'classnames';
import './styles.scss';
import styles from './styles.module.scss';
import Skeleton from 'react-loading-skeleton';
import DateTimePicker from '@/Editor/QueryManager/QueryEditors/TooljetDatabase/DateTimePicker';
import { TooljetDatabaseContext } from '@/TooljetDatabase';
import { getLocalTimeZone } from '@/Editor/QueryManager/QueryEditors/TooljetDatabase/util';
import { CellHinterWrapper } from './CellHinterWrapper';

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
  isTimestamp,
  referencedColumnDetails = [],
  referenceColumnName = '',
  isForeignKey = false,
  scrollEventForColumnValues,
  organizationId,
  foreignKeys,
  setReferencedColumnDetails,
  cellHeader,
  cachedOptions,
  dataType = '',
}) => {
  // below state is used only for boolean cell
  const [selectedValue, setSelectedValue] = useState(cellValue);
  const [shouldCloseFkMenu, setShouldCloseFKMenu] = useState(0);
  const [selectedForeignKeyValue, setSelectedForeignKeyValue] = useState({
    value: previousCellValue === 'Null' ? null : previousCellValue?.toString(),
    label: previousCellValue === 'Null' ? null : previousCellValue?.toString(),
  });

  const { getConfigurationProperty } = useContext(TooljetDatabaseContext);

  const handleDefaultChange = (defaultColumnValue, defaultBooleanValue) => {
    if (defaultBooleanValue === true) {
      setCellValue(defaultColumnValue);
      setSelectedForeignKeyValue({
        label: defaultColumnValue,
        value: defaultColumnValue,
      });
    } else {
      setCellValue(previousCellValue);
      setSelectedForeignKeyValue({
        label: previousCellValue?.toString(),
        value: previousCellValue?.toString(),
      });
    }
    if (previousCellValue !== defaultColumnValue) {
      setDefaultValue(false);
    }
    setDefaultValue(defaultBooleanValue);
    setNullValue(false);
  };

  const handleNullChange = (nullVal) => {
    if (nullVal === true) {
      setCellValue(null);
      setSelectedForeignKeyValue({
        label: null,
        value: null,
      });
      setDefaultValue(false);
    } else {
      if (previousCellValue === null) {
        setCellValue('');
        setSelectedForeignKeyValue({
          label: '',
          value: '',
        });
      } else if (previousCellValue === columnDetails?.column_default) {
        setDefaultValue(true);
        setCellValue(previousCellValue);
        setSelectedForeignKeyValue({
          label: previousCellValue,
          value: previousCellValue,
        });
      } else {
        setCellValue(previousCellValue);
        setSelectedForeignKeyValue({
          label: previousCellValue,
          value: previousCellValue,
        });
      }
    }
    setNullValue(nullVal);
  };

  const handleSelectedState = (value) => {
    setSelectedValue(value);
    setCellValue(value);
  };

  const closePopover = () => {
    setReferencedColumnDetails([]);
    setSelectedValue(previousCellValue);
    close();
  };

  const closeFKMenu = () => {
    setShouldCloseFKMenu((prev) => prev + 1);
  };

  const saveFKValue = () => {
    saveFunction(cellValue);
    closeFKMenu();
  };

  const handleSave = () => {
    if (isForeignKey) {
      saveFKValue();
    } else {
      saveFunction(cellValue);
      closePopover();
    }
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

    if (e.key === 'Enter' && cellValue != previousCellValue && show) {
      if (isForeignKey) {
        saveFKValue();
      } else {
        saveFunction(cellValue);
      }
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

  const referencedFKDataList = referencedColumnDetails.map((item) => {
    const [key, _value] = Object.entries(item);
    return {
      label: key[1] === null ? 'Null' : key[1]?.toString(),
      value: key[1] === null ? 'Null' : key[1]?.toString(),
    };
  });

  useEffect(() => {
    if (show) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, isBoolean, selectedValue, cellValue]);

  useEffect(() => {
    if (selectedValue !== cellValue) setSelectedValue(cellValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cellValue]);

  const SaveChangesSection = () => {
    return (
      <div className="d-flex justify-content-between align-items-center">
        <div className="d-flex flex-column align-items-start gap-1">
          <div className="d-flex align-items-center gap-1">
            <div className={`fw-500 ${styles.tjdbCellMenuShortcutsInfo}`}>
              <SolidIcon name="enterbutton" />
            </div>
            <div className={`fw-400 ${styles.tjdbCellMenuShortcutsText}`}>Save Changes</div>
          </div>
          <div className="d-flex align-items-center gap-1">
            <div className={`fw-500 ${styles.tjdbCellMenuShortcutsInfo}`}>Esc</div>
            <div className={`fw-400 ${styles.tjdbCellMenuShortcutsText}`}>Discard Changes</div>
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
                    onChange={(e) => {
                      e.stopPropagation();
                      handleNullChange(!nullValue);
                    }}
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
                    onChange={(e) => {
                      e.stopPropagation();
                      handleDefaultChange(columnDetails?.column_default, !defaultValue);
                    }}
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const SaveChangesFooter = ({ isForeignKeyInEditCell }) => {
    return (
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
          <ButtonSolid
            onClick={isForeignKeyInEditCell ? closeFKMenu : closePopover}
            variant="tertiary"
            size="sm"
            className="fs-12 p-2"
          >
            Cancel
          </ButtonSolid>
          <ButtonSolid
            onClick={handleSave}
            disabled={cellValue === previousCellValue}
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
    <Popover
      className={`${darkMode && 'dark-theme'} tjdb-table-cell-edit-popover`}
      onClick={(event) => {
        if (event.target.closest('.react-select-container')) {
          event.preventDefault(); // Prevent the Popover from closing
        }
      }}
    >
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
          {!isBoolean && <SaveChangesSection />}
          {/* Footer */}
          <SaveChangesFooter />
        </div>
      </Popover.Body>
    </Popover>
  );

  return (
    <OverlayTrigger
      show={dataType === 'jsonb' ? false : show}
      trigger="click"
      placement="bottom-start"
      rootclose
      overlay={popover}
      defaultShow
    >
      {isForeignKey ? (
        <DropDownSelect
          buttonClasses="border border-end-1 foreignKeyAcces-container"
          showPlaceHolder={true}
          loader={
            <>
              <Skeleton height={18} width={176} className="skeleton" style={{ margin: '15px 50px 7px 7px' }} />
              <Skeleton height={18} width={212} className="skeleton" style={{ margin: '7px 14px 7px 7px' }} />
              <Skeleton height={18} width={176} className="skeleton" style={{ margin: '7px 50px 15px 7px' }} />
            </>
          }
          isLoading={true}
          options={referencedFKDataList}
          darkMode={darkMode}
          emptyError={
            <div className="tjdb-cellmenu-error">
              <div className="dd-select-alert-error m-2 d-flex align-items-center">
                <Information />
                No data found
              </div>
            </div>
          }
          value={selectedForeignKeyValue}
          onChange={(value) => {
            setSelectedForeignKeyValue({
              label: value.value === 'Null' ? null : value.value,
              value: value.value === 'Null' ? null : value.value,
            });
            setCellValue(value.value === 'Null' ? null : value.value);
            setNullValue(value.value === 'Null' ? true : false);
          }}
          onAdd={true}
          closeFKMenu={closeFKMenu}
          saveFKValue={saveFKValue}
          addBtnLabel={'Open referenced table'}
          isCellEdit={true}
          scrollEventForColumnValues={scrollEventForColumnValues}
          organizationId={organizationId}
          foreignKeys={foreignKeys}
          setReferencedColumnDetails={setReferencedColumnDetails}
          cellColumnName={cellHeader}
          customChildren={
            <div className={`d-flex flex-column gap-3`} style={{ padding: '10px' }}>
              <SaveChangesSection />
              <SaveChangesFooter isForeignKeyInEditCell={true} />
            </div>
          }
          isForeignKeyInEditCell={true}
          shouldCloseFkMenu={shouldCloseFkMenu}
          cachedOptions={cachedOptions}
          columnDataType={dataType}
          columnDefaultValue={columnDetails?.column_default}
          setColumnDefaultValue={setDefaultValue}
        />
      ) : isTimestamp ? (
        <DateTimePicker
          isNotNull={columnDetails?.constraints_type.is_not_null}
          defaultValue={columnDetails?.column_default}
          isOpenOnStart={true}
          timestamp={selectedValue}
          setTimestamp={setSelectedValue}
          saveFunction={saveFunction}
          isEditCell={true}
          timezone={getConfigurationProperty(columnDetails?.Header, 'timezone', getLocalTimeZone())}
        />
      ) : dataType === 'jsonb' ? (
        <div>
          <CellHinterWrapper
            isNotNull={columnDetails?.constraints_type.is_not_null}
            defaultValue={columnDetails?.column_default}
            selectedValue={selectedValue}
            setSelectedValue={setSelectedValue}
            saveFunction={saveFunction}
            isEditCell={true}
            columnDetails={columnDetails}
            close={close}
            closePopover={closePopover}
            show={show}
            previousCellValue={previousCellValue}
          />
        </div>
      ) : (
        // </div>
        children
      )}
    </OverlayTrigger>
  );
};
