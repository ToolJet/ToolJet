import React, { useEffect, useRef, useState } from 'react';
import SelectBox from './SelectBox';
import cx from 'classnames';
import useShowPopover from '@/_hooks/useShowPopover';
import { Badge, OverlayTrigger, Popover } from 'react-bootstrap';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import CheveronDown from '@/_ui/Icon/bulkIcons/CheveronDown';
import Remove from '@/_ui/Icon/bulkIcons/Remove';
import { v4 as uuidv4 } from 'uuid';
import { isEmpty } from 'lodash';
import { ToolTip } from '@/_components/ToolTip';

const DropDownSelect = ({
  darkMode,
  disabled,
  options,
  isMulti,
  addBtnLabel,
  onAdd,
  onChange,
  value,
  renderSelected,
  emptyError,
  shouldCenterAlignText = false,
  showPlaceHolder = false,
  highlightSelected = true,
  buttonClasses = '',
  foreignKeyAccess = false,
  showRedirection = false,
  columnInfoForTable,
  showColumnInfo = false,
  showDescription = false,
  foreignKeyAccessInRowForm = false,
  topPlaceHolder = '',
  showPlaceHolderInForeignKeyDrawer = false,
  isCellEdit = false,
  scrollEventForColumnValues,
  organizationId,
  foreignKeys,
  setReferencedColumnDetails,
  shouldShowForeignKeyIcon = false,
  cellColumnName,
  tableName,
  targetTable,
  actions,
  actionName,
  fetchTables,
  onTableClick,
  referencedForeignKeyDetails = [],
  cachedOptions,
  columnDataType = '',
  isCreateRow = false,
  isEditRow = false,
  isCreateColumn = false,
  isEditColumn = false,
  isEditTable = false,
  isCreateTable = false,
  customChildren,
  isForeignKeyInEditCell = false,
  shouldCloseFkMenu,
  closeFKMenu,
  saveFKValue,
  loader,
  isLoading = false,
  columnDefaultValue = '',
  setColumnDefaultValue = () => {},
  showControlComponent = false,
  placeholder = '',
}) => {
  const popoverId = useRef(`dd-select-${uuidv4()}`);
  const popoverBtnId = useRef(`dd-select-btn-${uuidv4()}`);
  const [showMenu, setShowMenu] = useShowPopover(
    isForeignKeyInEditCell,
    `#${popoverId.current}`,
    `#${popoverBtnId.current}`
  );
  const [selected, setSelected] = useState(value);
  const [isOverflown, setIsOverflown] = useState(false);
  // Applicable when drop down is used to list FK data
  const [isInitialForeignKeyDataLoaded, setIsInitialForeignKeyDataLoaded] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  //following two states are to determine whether the value is truncated or not to show tooltip
  const valueRef = useRef(null);
  const [isTruncated, setIsTruncated] = useState(false);
  const prevShowMenu = useRef(false);

  useEffect(() => {
    if (shouldCloseFkMenu) {
      setShowMenu(false);
    }
  }, [shouldCloseFkMenu]);

  useEffect(() => {
    if (showMenu) {
      // selectRef.current.focus();
    }
  }, [showMenu]);

  useEffect(() => {
    if (Array.isArray(value) || selected?.value !== value?.value || selected?.label !== value?.label) {
      setSelected(value);
    }
    const element = valueRef.current;
    if (element) {
      // Check if the text is truncated
      const truncated = element.scrollWidth > element.clientWidth;
      setIsTruncated(truncated);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    // onChange && onChange(selected);
    const badges = document.querySelectorAll('.dd-select-value-badge');
    if (isEmpty(badges)) {
      return () => {};
    }
    let isNewOverFlown = false;
    for (let i = 0; i < badges.length; i++) {
      const el = badges[i];
      isNewOverFlown = el.clientWidth - el.scrollWidth < 0;
      if (isOverflown) {
        break;
      }
    }
    if (isNewOverFlown !== isOverflown) {
      setIsOverflown(isNewOverFlown);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  useEffect(() => {
    const container = document.getElementsByClassName('query-details')[0];
    const popoverBtn = document.getElementById(popoverBtnId.current);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (prevShowMenu.current) {
            setShowMenu(true);
            prevShowMenu.current = false;
          }
        } else if (showMenu) {
          setShowMenu(false);
          prevShowMenu.current = true;
        }
        if (!entry.isIntersecting && showMenu) {
          setShowMenu(false);
        }
      },
      { root: container, threshold: [0.5] }
    );

    if (popoverBtn) {
      observer.observe(popoverBtn);
    }

    return () => {
      if (popoverBtn) {
        observer.unobserve(popoverBtn);
      }
    };
  }, [showMenu]);

  function checkElementPosition() {
    if (isForeignKeyInEditCell) {
      return 'bottom-start';
    }
    const selectControl = document.getElementById(popoverBtnId.current);
    if (!selectControl) {
      return 'top-start';
    }

    const elementRect = selectControl.getBoundingClientRect();
    // Check proximity to top
    const halfScreenHeight = window.innerHeight / 2;
    if (elementRect.top <= halfScreenHeight) return 'bottom-start';
    return 'top-start';
  }

  function isValidInput(input) {
    if (!input) return false;
    if (Array.isArray(input)) {
      return input.length ? true : false;
    }
    if (typeof input === 'object' && !Array.isArray(input)) {
      if (!Object.keys(input).length) return false;
      if (!input.value) return false;
      return true;
    }
    return true;
  }

  const fetchTooltipMessageForDropdownSelected = (selected) => {
    let message = '';
    if (Array.isArray(selected)) {
      message = selected.reduce((accumulator, value) => {
        if (accumulator) {
          accumulator = `${accumulator}, ${value?.label || ''}`;
        } else {
          accumulator = value?.label || '';
        }
        return accumulator;
      }, '');
      return message;
    }
    message = selected?.label || '';
    return message;
  };

  return (
    <OverlayTrigger
      show={showMenu && !disabled}
      placement={checkElementPosition()}
      overlay={
        <Popover
          key={'page.i'}
          id={popoverId.current}
          className={`${darkMode && 'popover-dark-themed dark-theme tj-dark-mode'}`}
          style={{
            width: isForeignKeyInEditCell
              ? '300px'
              : foreignKeyAccess
              ? '403px'
              : foreignKeyAccessInRowForm === true
              ? '494px'
              : isCellEdit
              ? '266px'
              : '244px',
            maxWidth: isForeignKeyInEditCell
              ? '300px'
              : foreignKeyAccess
              ? '403px'
              : foreignKeyAccessInRowForm === true
              ? '494px'
              : isCellEdit
              ? '266px'
              : '246px',
            overflow: 'hidden',
            boxShadow: '0px 2px 4px -2px rgba(16, 24, 40, 0.06), 0px 4px 8px -2px rgba(16, 24, 40, 0.10)',
          }}
        >
          <SelectBox
            options={options}
            isMulti={isMulti}
            onSelect={(values) => {
              setIsOverflown(false);
              onChange && onChange(values);
              setSelected(values);
            }}
            selected={selected}
            closePopup={() => setShowMenu(isForeignKeyInEditCell ? true : false)}
            onAdd={onAdd}
            addBtnLabel={addBtnLabel}
            loader={loader}
            isLoading={isLoading}
            emptyError={emptyError}
            highlightSelected={highlightSelected}
            foreignKeyAccess={foreignKeyAccess}
            showRedirection={showRedirection}
            columnInfoForTable={columnInfoForTable}
            showColumnInfo={showColumnInfo}
            showDescription={showDescription}
            foreignKeyAccessInRowForm={foreignKeyAccessInRowForm}
            isCellEdit={isCellEdit}
            scrollEventForColumnValues={scrollEventForColumnValues}
            organizationId={organizationId}
            foreignKeys={foreignKeys}
            setReferencedColumnDetails={setReferencedColumnDetails}
            shouldShowForeignKeyIcon={shouldShowForeignKeyIcon}
            cellColumnName={cellColumnName}
            isInitialForeignKeyDataLoaded={isInitialForeignKeyDataLoaded}
            setIsInitialForeignKeyDataLoaded={setIsInitialForeignKeyDataLoaded}
            totalRecords={totalRecords}
            setTotalRecords={setTotalRecords}
            pageNumber={pageNumber}
            setPageNumber={setPageNumber}
            tableName={tableName}
            targetTable={targetTable}
            actions={actions}
            actionName={actionName}
            referencedForeignKeyDetails={referencedForeignKeyDetails}
            cachedOptions={cachedOptions}
            columnDataType={columnDataType}
            isCreateRow={isCreateRow}
            isEditRow={isEditRow}
            isEditColumn={isEditColumn}
            isCreateColumn={isCreateColumn}
            isEditTable={isEditTable}
            isCreateTable={isCreateTable}
            customChildren={customChildren}
            isForeignKeyInEditCell={isForeignKeyInEditCell}
            closeFKMenu={closeFKMenu}
            saveFKValue={saveFKValue}
            columnDefaultValue={columnDefaultValue}
            setColumnDefaultValue={setColumnDefaultValue}
            showControlComponent={showControlComponent}
          />
        </Popover>
      }
    >
      {isForeignKeyInEditCell ? (
        <div
          className={`col-auto`}
          style={{
            position: 'relative',
            left: '-10px',
            top: selected.label === null || selected.label === undefined || isCellEdit ? '0px' : '2px',
            paddingLeft: '10px',
            paddingBottom: '4px',
          }}
          id={popoverBtnId.current}
          onClick={() => {
            setShowMenu(true);
          }}
        >
          <p
            className={cx({
              'd-flex align-items-center justify-content-center m-0':
                selected.label === null || selected.label === undefined,
              'cell-menu-text m-0': selected.label !== null || selected.label !== undefined,
            })}
            style={{
              color: darkMode ? '#fff' : '',
              width: (selected.label === null || selected.label === undefined) && '40px',
              background: (selected.label === null || selected.label === undefined) && 'var(--slate3)',
            }}
          >
            {selected?.label ?? 'Null'}
          </p>
        </div>
      ) : (
        <div className={`col-auto ${buttonClasses}`} id={popoverBtnId.current}>
          <ButtonSolid
            size="sm"
            variant="tertiary"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              if (disabled) {
                return;
              }
              setShowMenu((show) => !show);
              if (onTableClick === true) {
                fetchTables();
              }
            }}
            className={cx(
              {
                'justify-content-start': !shouldCenterAlignText,
                'justify-content-centre': shouldCenterAlignText,
                'border-1 tdb-dropdown-btn-foreignKeyAccess': foreignKeyAccess || foreignKeyAccessInRowForm,
                'border-0 tdb-dropdown-btn': !foreignKeyAccess || !foreignKeyAccessInRowForm,
              },
              'gap-0',
              'w-100',
              'rounded-0',
              'position-relative',
              'font-weight-normal',
              'px-1'
            )}
            data-cy={`show-ds-popover-button`}
          >
            <ToolTip
              message={fetchTooltipMessageForDropdownSelected(selected)}
              show={!!fetchTooltipMessageForDropdownSelected(selected) && isTruncated}
            >
              <div className={`text-truncate`} ref={valueRef}>
                {renderSelected && renderSelected(selected)}
                <>
                  {!renderSelected && isValidInput(selected) ? (
                    Array.isArray(selected) ? (
                      !isOverflown && (
                        <MultiSelectValueBadge
                          options={options}
                          selected={selected}
                          setSelected={setSelected}
                          onChange={onChange}
                        />
                      )
                    ) : (
                      selected?.label
                    )
                  ) : showPlaceHolder ? (
                    <span style={{ color: '#9e9e9e', fontSize: '12px', fontWeight: '400', lineHeight: '20px' }}>
                      {foreignKeyAccessInRowForm || showPlaceHolderInForeignKeyDrawer
                        ? topPlaceHolder
                        : placeholder
                        ? placeholder
                        : 'Select...'}
                    </span>
                  ) : (
                    ''
                  )}
                  {!renderSelected && isOverflown && !Array.isArray(selected) && (
                    <Badge className="me-1 dd-select-value-badge" bg="secondary">
                      {selected?.length} selected
                      <span
                        role="button"
                        onClick={(e) => {
                          setSelected([]);
                          onChange && onChange([]);
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        <Remove fill="var(--slate12)" width="12px" />
                      </span>
                    </Badge>
                  )}
                </>
              </div>
            </ToolTip>
            <div className="dd-select-control-chevron">
              <CheveronDown width="15" height="15" />
            </div>
          </ButtonSolid>
        </div>
      )}
    </OverlayTrigger>
  );
};

function MultiSelectValueBadge({ options, selected, setSelected, onChange }) {
  if (options?.length === selected?.length && selected?.length !== 0) {
    // Filter Options without 'Select All'
    const optionsWithoutSelectAll = options?.filter((option) => option?.value !== 'SELECT ALL');
    return (
      <Badge className={`me-1 dd-select-value-badge`} bg="secondary">
        All {optionsWithoutSelectAll?.length} selected
        <span
          role="button"
          onClick={(e) => {
            e.stopPropagation();
            setSelected([]);
            onChange([]);
            e.preventDefault();
          }}
        >
          <Remove fill="var(--slate12)" />
        </span>
      </Badge>
    );
  }

  return selected?.map((option) => (
    <Badge key={option?.value} className="me-1 dd-select-value-badge" bg="secondary">
      {option?.label}
      <span
        role="button"
        onClick={(e) => {
          setSelected((selected) => {
            onChange && onChange(selected.filter((opt) => opt?.value !== option?.value));
            return selected?.filter((opt) => opt?.value !== option?.value);
          });
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <Remove fill="var(--slate12)" />
      </span>
    </Badge>
  ));
}

export default DropDownSelect;
