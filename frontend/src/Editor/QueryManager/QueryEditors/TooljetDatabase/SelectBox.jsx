import React, { isValidElement, useCallback, useState, useRef, useEffect } from 'react';
import Select, { components } from 'react-select';
import { isEmpty, debounce, throttle } from 'lodash';
import { authenticationService, tooljetDatabaseService } from '@/_services';
import { toast } from 'react-hot-toast';
import PostgrestQueryBuilder from '@/_helpers/postgrestQueryBuilder';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import Search from '@/_ui/Icon/solidIcons/Search';
import Maximize from '@/TooljetDatabase/Icons/maximize.svg';
import { Form } from 'react-bootstrap';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { getPrivateRoute } from '@/_helpers/routes';
import cx from 'classnames';
import { ToolTip } from '@/_components/ToolTip';
import ArrowRight from '@/TooljetDatabase/Icons/ArrowRight.svg';

function DataSourceSelect({
  darkMode,
  isDisabled,
  selectRef,
  closePopup,
  options,
  isMulti,
  onSelect,
  onAdd,
  addBtnLabel,
  selected,
  emptyError,
  highlightSelected,
  foreignKeyAccess = false,
  showRedirection = false,
  columnInfoForTable,
  showColumnInfo = false,
  showDescription = false,
  foreignKeyAccessInRowForm,
  isCellEdit,
  scrollEventForColumnValus,
  organizationId,
  foreignKeys,
  setReferencedColumnDetails,
  shouldShowForeignKeyIcon = false,
  cellColumnName,
  isInitialForeignKeyDataLoaded = false,
  setIsInitialForeignKeyDataLoaded,
  totalRecords,
  setTotalRecords,
  pageNumber,
  setPageNumber,
  tableName,
  targetTable,
  actions,
  actionName,
  referencedForeignKeyDetails,
}) {
  const [isLoadingFKDetails, setIsLoadingFKDetails] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isInitialForeignKeSearchDataLoaded, setIsInitialForeignKeSearchDataLoaded] = useState(false);
  const scrollContainerRef = useRef(null);

  const handleChangeDataSource = (source) => {
    onSelect && onSelect(source);
    closePopup && !isMulti && closePopup();
  };

  let optionsCount = options.length;

  options.forEach((item) => {
    if (item.options && item.options.length > 0) {
      optionsCount += item.options.length;
    }
  });

  useEffect(() => {
    function getForeignKeyDetails(incrementPageBy) {
      if (isEmpty(searchValue)) {
        const limit = 15;
        const offset = (pageNumber - 1) * limit;

        if (offset >= totalRecords && isInitialForeignKeyDataLoaded) {
          return;
        }

        setIsLoadingFKDetails(true);
        const selectQuery = new PostgrestQueryBuilder();
        // Checking that the selected column is available in ForeignKey
        const referencedColumns = foreignKeys?.find((item) => item.column_names[0] === cellColumnName);
        if (!referencedColumns?.referenced_column_names?.length) return;
        selectQuery.select(referencedColumns?.referenced_column_names[0]);

        tooljetDatabaseService
          .findOne(
            organizationId,
            foreignKeys?.length > 0 && referencedColumns?.referenced_table_id,
            `${selectQuery.url.toString()}&limit=${limit}&offset=${offset}`
          )
          .then(({ headers, data = [], error }) => {
            if (error) {
              toast.error(
                error?.message ??
                  `Failed to fetch table "${foreignKeys?.length > 0 && foreignKeys[0].referenced_table_name}"`
              );
              setIsLoadingFKDetails(false);
              return;
            }

            const totalFKRecords = headers['content-range'].split('/')[1] || 0;
            if (Array.isArray(data) && data?.length > 0) {
              if (pageNumber === 1) setIsInitialForeignKeyDataLoaded(true);
              setReferencedColumnDetails((prevData) => [...prevData, ...data]);
              setPageNumber((prevPageNumber) => prevPageNumber + incrementPageBy);
              if (totalRecords !== totalFKRecords) setTotalRecords(totalFKRecords);
            }
            setIsLoadingFKDetails(false);
          });
      }
    }

    function handleScroll() {
      const target = scrollContainerRef?.current;
      let scrollTop = target?.scrollTop;
      const scrollPercentage = ((scrollTop + target?.clientHeight) / target?.scrollHeight) * 100;

      if (scrollPercentage > 90 && !isLoadingFKDetails) {
        if (isEmpty(searchValue)) getForeignKeyDetails(1);
      }
    }

    const handleScrollThrottled = throttle(handleScroll, 500);

    if (scrollEventForColumnValus && !searchValue) {
      if (!isInitialForeignKeyDataLoaded && !isLoadingFKDetails) getForeignKeyDetails(1);
      scrollContainerRef?.current?.addEventListener('scroll', handleScrollThrottled);
    }

    return () => {
      scrollContainerRef?.current?.removeEventListener('scroll', handleScrollThrottled);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue, pageNumber, totalRecords, isLoadingFKDetails]);

  useEffect(() => {
    function handleSearchInSelectBox() {
      if (!isEmpty(searchValue)) {
        const limit = 100;
        // Only first page will be loaded - for Search
        const offset = (1 - 1) * limit;

        if (isInitialForeignKeSearchDataLoaded) return;
        setIsLoadingFKDetails(true);
        const selectQuery = new PostgrestQueryBuilder();
        const filterQuery = new PostgrestQueryBuilder();

        const referencedColumns = foreignKeys?.find((item) => item.column_names[0] === cellColumnName);
        if (!referencedColumns?.referenced_column_names?.length) return;
        selectQuery.select(referencedColumns?.referenced_column_names[0]);

        if (scrollEventForColumnValus) {
          filterQuery.eq(referencedColumns?.referenced_column_names[0], searchValue);
          // filterQuery.ilike(referencedColumns?.referenced_column_names[0], `%${searchValue}%`);
        }

        const query = `${selectQuery.url.toString()}&${filterQuery.url.toString()}&limit=${limit}&offset=${offset}`;

        tooljetDatabaseService
          .findOne(organizationId, foreignKeys?.length > 0 && referencedColumns?.referenced_table_id, query)
          .then(({ _headers, data = [], error }) => {
            if (error) {
              toast.error(
                error?.message ??
                  `Failed to fetch table "${foreignKeys?.length > 0 && foreignKeys[0].referenced_table_name}"`
              );
              setIsLoadingFKDetails(false);
              return;
            }

            if (Array.isArray(data) && data?.length > 0) {
              setIsInitialForeignKeSearchDataLoaded(true);
              const currentSearchResultList = data.map((item) => ({
                value: item[referencedColumns?.referenced_column_names[0]],
                label: item[referencedColumns?.referenced_column_names[0]],
              }));
              setSearchResults([...currentSearchResultList]);
            }
            setIsLoadingFKDetails(false);
          });
      }
    }
    let debouncedHandleSearchInSelectBox;
    if (scrollEventForColumnValus) {
      debouncedHandleSearchInSelectBox = debounce(() => {
        // Making the values to default
        if (searchResults.length) setSearchResults([]);
        setIsInitialForeignKeSearchDataLoaded(false);

        if (!isLoadingFKDetails) handleSearchInSelectBox(1, true);
      }, 500);

      debouncedHandleSearchInSelectBox();
    }

    return debouncedHandleSearchInSelectBox?.cancel;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue]);

  useEffect(() => {
    // Making the Infinite scroll pagination API to default state
    return () => {
      if (scrollEventForColumnValus) {
        setIsInitialForeignKeyDataLoaded(false);
        setIsInitialForeignKeSearchDataLoaded(false);
        setTotalRecords(0);
        setPageNumber(1);
        setSearchValue('');
        setSearchResults([]);
        setReferencedColumnDetails([]);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const modifiedOptions = [...options].sort((a, b) => {
    if (a.isDisabled && !b.isDisabled) return -1;
    if (!a.isDisabled && b.isDisabled) return 1;
    return 0;
  });

  return (
    <div onKeyDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
      <Select
        onChange={(option) => {
          handleChangeDataSource(option);
        }}
        classNames={{
          menu: () =>
            foreignKeyAccess
              ? 'tj-scrollbar tjdb-dashboard-scrollbar'
              : foreignKeyAccessInRowForm
              ? 'tj-scrollbar tjdb-rowForm-scrollbar'
              : isCellEdit
              ? 'tj-scrollbar tjdb-cellEdit-scrollbar'
              : 'tj-scrollbar',
        }}
        ref={selectRef}
        controlShouldRenderValue={false}
        menuPlacement="auto"
        menuIsOpen
        autoFocus
        hideSelectedOptions={false}
        components={{
          // ...(isMulti && {
          Option: ({ children, ...props }) => {
            return (
              <components.Option {...props}>
                <ToolTip
                  message={`Foreign key relation cannot be created for ${props?.data?.dataType} column`}
                  placement="top"
                  tooltipClassName="tootip-table"
                  show={(foreignKeyAccess && props.data.dataType === 'serial') || props.data.dataType === 'boolean'}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: showRedirection || actions ? 'space-between' : 'flex-start',
                      alignItems: 'center',
                      cursor: foreignKeyAccess && props.data.isDisabled && 'not-allowed',
                    }}
                    className={`dd-select-option ${showDescription && 'h-100'}`}
                  >
                    {isMulti && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          // width: '20px',
                        }}
                      >
                        <Form.Check // prettier-ignore
                          type={'checkbox'}
                          id={props.value}
                          className="me-1"
                          checked={props.isSelected}
                          // label={`default ${type}`}
                        />
                      </div>
                    )}
                    {props?.data?.icon &&
                      (isValidElement(props.data.icon) ? (
                        props.data.icon
                      ) : (
                        <SolidIcon
                          name={props.data.icon}
                          style={{ height: 16, width: 16 }}
                          width={20}
                          height={17}
                          viewBox=""
                        />
                      ))}

                    <span
                      className={cx({
                        'ms-1 ': props?.data?.icon,
                        'flex-grow-1': !showDescription,
                      })}
                    >
                      {children}
                    </span>

                    {foreignKeyAccess && showRedirection && props.isFocused && (
                      <Maximize
                        width={16}
                        style={{
                          ...(props.isSelected &&
                            highlightSelected && {
                              marginRight: '10px',
                              marginTop: '3px',
                            }),
                        }}
                        onClick={() => {
                          const data = { id: props.data.id, table_name: props.data.value };
                          localStorage.setItem('tableDetails', JSON.stringify(data));
                          window.open(getPrivateRoute('database'), '_blank');
                        }}
                      />
                    )}
                    {props.isSelected && highlightSelected && (
                      <SolidIcon
                        fill="var(--indigo9)"
                        name="tick"
                        style={{ height: 16, width: 16, marginTop: '-4px' }}
                        viewBox="0 0 20 20"
                        className="mx-1"
                      />
                    )}

                    {shouldShowForeignKeyIcon && props?.data?.isTargetTable && (
                      <ToolTip
                        message={referencedForeignKeyDetails?.map(
                          (item, index) =>
                            item?.referenced_table_id === props?.data?.value && (
                              <div key={item?.referenced_table_id}>
                                <span>Foreign key relation</span>
                                <div className="d-flex align-item-center justify-content-between mt-2 custom-tooltip-style">
                                  <span>{item?.column_names[0]}</span>
                                  <ArrowRight />
                                  <span>{`${item?.referenced_table_name}.${item?.referenced_column_names[0]}`}</span>
                                </div>
                              </div>
                            )
                        )}
                        placement="top"
                        tooltipClassName="tjdb-table-tooltip"
                      >
                        <div>
                          <SolidIcon name="foreignkey" height={'14'} width={'24'} />
                        </div>
                      </ToolTip>
                    )}
                  </div>
                </ToolTip>
              </components.Option>
            );
          },
          // }),
          MenuList: useCallback(
            (props) => {
              const selectedOption =
                props &&
                props.children &&
                Array.isArray(props.children) &&
                props?.children?.reduce((accumulator, reactElement) => {
                  const props = reactElement?.props ?? {};
                  if (props?.isSelected) {
                    accumulator = { ...props?.data };
                  }
                  return accumulator;
                }, {});
              const focusedOption =
                props &&
                props.children &&
                Array.isArray(props.children) &&
                props?.children?.reduce((accumulator, reactElement) => {
                  const props = reactElement?.props ?? {};
                  if (props?.isFocused) {
                    accumulator = { ...props?.data };
                  }
                  return accumulator;
                }, {});

              return (
                <React.Fragment>
                  <MenuList
                    {...props}
                    onAdd={onAdd}
                    addBtnLabel={addBtnLabel}
                    emptyError={emptyError}
                    foreignKeyAccess={foreignKeyAccess}
                    columnInfoForTable={columnInfoForTable}
                    showColumnInfo={showColumnInfo}
                    foreignKeyAccessInRowForm={foreignKeyAccessInRowForm}
                    scrollEventForColumnValus={scrollEventForColumnValus}
                    scrollContainerRef={scrollContainerRef}
                    foreignKeys={foreignKeys}
                    cellColumnName={cellColumnName}
                    isLoadingFKDetails={isLoadingFKDetails}
                  />
                  {foreignKeyAccess && showDescription && actions && (
                    <>
                      <div style={{ borderTop: '1px solid var(--slate5)' }}></div>
                      <div
                        style={{
                          // minHeight: '140px',
                          height: 'fit-content',
                          padding: '8px 12px',
                        }}
                      >
                        <div className="tj-header-h8 tj-text">
                          {!isEmpty(focusedOption) ? focusedOption?.label : selectedOption?.label}
                        </div>
                        <span className="tj-text-xsm" style={{ color: 'var(--slate9)' }}>
                          {
                            <GenerateActionsDescription
                              targetTable={targetTable?.value || targetTable?.label || targetTable?.name}
                              sourceTable={tableName}
                              actionName={actionName}
                              label={!isEmpty(focusedOption) ? focusedOption?.label : selectedOption?.label}
                            />
                          }
                        </span>
                      </div>
                    </>
                  )}
                </React.Fragment>
              );
            },
            // eslint-disable-next-line react-hooks/exhaustive-deps
            [onAdd, addBtnLabel, emptyError]
          ),
          IndicatorSeparator: () => null,
          DropdownIndicator,
          GroupHeading: CustomGroupHeading,
          ...(optionsCount < 5 && !scrollEventForColumnValus && { Control: () => '' }),
        }}
        styles={{
          control: (style) => ({
            ...style,
            // width: '240px',
            background: 'var(--base)',
            color: 'var(--slate9)',
            borderWidth: '0',
            // borderBottom: '1px solid var(--slate7)',
            // marginBottom: '1px',
            boxShadow: 'none',
            borderRadius: '4px 4px 0 0',
            borderBottom: '1px solid var(--slate-05, #E6E8EB)',
            ':hover': {
              borderColor: 'var(--slate7)',
            },
            flexDirection: 'row-reverse',
          }),
          menu: (style) => ({
            ...style,
            position: 'static',
            backgroundColor: 'var(--base)',
            color: 'var(--slate12)',
            boxShadow: 'none',
            border: '0',
            marginTop: 0,
            marginBottom: 0,
            width: '240px',
            borderTopRightRadius: 0,
            borderTopLeftRadius: 0,
          }),
          // indicatorSeparator: () => ({ display: 'none' }),
          input: (style) => ({
            ...style,
            color: 'var(--slate12)',
            'caret-color': 'var(--slate9)',
            border: 0,
            ':placeholder': { color: 'var(--slate9)' },
          }),
          groupHeading: (style) => ({
            ...style,
            fontSize: '100%',
            color: 'var(--slate-11, #687076)',
            // font-size: 12px;
            // font-style: normal;
            fontWeight: 500,
            lineHeight: '20px',
            textTransform: 'uppercase',
          }),
          option: (style, { data: { isNested }, isFocused, isDisabled, isSelected }) => ({
            ...style,
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            color: isDisabled ? 'var(--slate8, #c1c8cd)' : 'inherit',
            backgroundColor:
              isSelected && highlightSelected
                ? 'var(--indigo3, #F0F4FF)'
                : isFocused && !isNested
                ? 'var(--slate4)'
                : isDisabled
                ? 'transparent'
                : isDisabled && isFocused
                ? 'var(--slate3, #f1f3f5)'
                : 'transparent',
            ...(isNested
              ? { padding: '0 8px', marginLeft: '19px', borderLeft: '1px solid var(--slate5)', width: 'auto' }
              : {}),
            ...(!isNested && { borderRadius: '4px' }),
            ':hover': {
              backgroundColor: isNested ? 'transparent' : 'var(--slate4)',
              '.option-nested-datasource-selector': { backgroundColor: 'var(--slate4)' },
            },
            ...(isFocused &&
              isNested && {
                '.option-nested-datasource-selector': { backgroundColor: 'var(--slate4)' },
              }),
          }),
          group: (style) => ({
            ...style,
            ':not(:first-child)': {
              borderTop: '1px solid var(--slate-05, #E6E8EB)',
              marginTop: '8px',
            },
            paddingBottom: 0,
            '.dd-select-option': { marginLeft: '19px' },
          }),
          container: (styles) => ({
            ...styles,
            borderRadius: '6px',
          }),
          valueContainer: (styles) => ({
            ...styles,
            paddingLeft: 0,
          }),
        }}
        placeholder="Search"
        options={scrollEventForColumnValus && searchValue ? searchResults : modifiedOptions}
        isDisabled={isDisabled}
        isClearable={false}
        isMulti={isMulti}
        maxMenuHeight={400}
        minMenuHeight={300}
        value={selected}
        inputValue={searchValue}
        onInputChange={(value) => {
          setSearchValue(value);
        }}
      />
    </div>
  );
}

const MenuList = ({
  children,
  getStyles,
  innerRef,
  onAdd,
  addBtnLabel,
  emptyError,
  foreignKeyAccess,
  columnInfoForTable,
  showColumnInfo,
  options,
  foreignKeyAccessInRowForm,
  scrollEventForColumnValus,
  scrollContainerRef,
  foreignKeys,
  cellColumnName,
  isLoadingFKDetails = false,
  ...props
}) => {
  const menuListStyles = getStyles('menuList', props);
  const referencedColumnDetails = foreignKeys?.find((item) => item.column_names[0] === cellColumnName);

  const handleNavigateToReferencedTable = () => {
    const data = {
      id: referencedColumnDetails?.referenced_table_id,
      table_name: referencedColumnDetails?.referenced_table_name,
    };
    localStorage.setItem('tableDetails', JSON.stringify(data));
    window.open(getPrivateRoute('database'), '_blank');
  };

  const { admin } = authenticationService.currentSessionValue;
  if (admin) {
    //offseting for height of button since react-select calculates only the size of options list
    menuListStyles.maxHeight = 225 - 48;
  }
  menuListStyles.padding = '4px';

  return (
    <>
      {!isEmpty(options) && showColumnInfo && columnInfoForTable}
      {isEmpty(options) && emptyError && !isLoadingFKDetails ? (
        emptyError
      ) : (
        <div
          ref={scrollEventForColumnValus ? scrollContainerRef : innerRef}
          style={menuListStyles}
          id="query-ds-select-menu"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      )}
      {onAdd && (
        <div
          className={cx('mt-2 border-slate3-top', {
            'tj-foreignKey p-1': foreignKeyAccess || foreignKeyAccessInRowForm,
            'p-2': !foreignKeyAccess || !foreignKeyAccessInRowForm,
          })}
        >
          <ButtonSolid
            variant="secondary"
            size="md"
            className="w-100"
            onClick={scrollEventForColumnValus ? handleNavigateToReferencedTable : onAdd}
          >
            {!foreignKeyAccessInRowForm && '+'} {addBtnLabel || 'Add new'}
            {foreignKeyAccessInRowForm && <Maximize fill={'#3e63dd'} />}
          </ButtonSolid>
        </div>
      )}
    </>
  );
};

const DropdownIndicator = (props) => {
  return (
    components.DropdownIndicator && (
      <components.DropdownIndicator {...props}>
        <Search style={{ width: '16px' }} />
      </components.DropdownIndicator>
    )
  );
};

const CustomGroupHeading = (props) => {
  const [isGroupListCollapsed, setIsGroupListCollapsed] = useState(false);

  const handleHeaderClick = (id) => {
    const node = document.querySelector(`#${id}`)?.parentElement?.nextElementSibling;
    const classes = node?.classList;
    const hidden = classes?.contains('d-none');

    if (hidden) {
      setIsGroupListCollapsed(false);
      node.classList.remove('d-none');
    } else {
      setIsGroupListCollapsed(true);
      node.classList.add('d-none');
    }
  };

  return (
    <div
      className="group-heading-wrapper d-flex justify-content-between"
      onClick={() => handleHeaderClick(props.id)}
      style={{ cursor: 'pointer' }}
    >
      <components.GroupHeading {...props} />{' '}
      <SolidIcon name={isGroupListCollapsed ? 'cheverondown' : 'cheveronup'} height={20} />
    </div>
  );
};

const GenerateActionsDescription = ({ targetTable, sourceTable, actionName = '', label }) => {
  const isActionOnUpdate = actionName === 'On update';

  const Description = Object.freeze({
    noAction: isActionOnUpdate ? (
      <>
        Updating a record from{' '}
        <span className="action-description-highlighter">{targetTable ? targetTable : '< target table name >'}</span>{' '}
        table will not be permitted for any records that references it in{' '}
        <span className="action-description-highlighter">{sourceTable ? sourceTable : '< source table name >'}</span>{' '}
        table.
      </>
    ) : (
      <>
        Deleting a record from{' '}
        <span className="action-description-highlighter">{targetTable ? targetTable : '< target table name >'}</span>{' '}
        table will not be permitted for any records that references it in{' '}
        <span className="action-description-highlighter">{sourceTable ? sourceTable : '< source table name >'}</span>{' '}
        table.
      </>
    ),
    cascade: isActionOnUpdate ? (
      <>
        Updating a record from{' '}
        <span className="action-description-highlighter">{targetTable ? targetTable : '< target table name >'}</span>{' '}
        table will also update any records that references it in{' '}
        <span className="action-description-highlighter">{sourceTable ? sourceTable : '< source table name >'}</span>{' '}
        table.
      </>
    ) : (
      <>
        Deleting a record from{' '}
        <span className="action-description-highlighter">{targetTable ? targetTable : '< target table name >'}</span>{' '}
        table will also delete any records that references it in{' '}
        <span className="action-description-highlighter">{sourceTable ? sourceTable : '< source table name >'}</span>{' '}
        table.
      </>
    ),
    restrict: isActionOnUpdate ? (
      <>
        Updating a record from{' '}
        <span className="action-description-highlighter">{targetTable ? targetTable : '< target table name >'}</span>{' '}
        table will not be permitted for any records that references it in{' '}
        <span className="action-description-highlighter">{sourceTable ? sourceTable : '< source table name >'}</span>{' '}
        table.
        {/* <br />
        It is similar to NO ACTION but NO ACTION allows the check to be deferred until later in the transaction, whereas
        RESTRICT does not. */}
      </>
    ) : (
      <>
        Deleting a record from{' '}
        <span className="action-description-highlighter">{targetTable ? targetTable : '< target table name >'}</span>{' '}
        table will not be permitted for any records that reference it in{' '}
        <span className="action-description-highlighter">{sourceTable ? sourceTable : '< source table name >'}</span>{' '}
        table.
        {/* <br />
        It is similar to NO ACTION but NO ACTION allows the check to be deferred until later in the transaction, whereas
        RESTRICT does not. */}
      </>
    ),
    setNull: isActionOnUpdate ? (
      <>
        Updating a record from{' '}
        <span className="action-description-highlighter">{targetTable ? targetTable : '< target table name >'}</span>{' '}
        table will set the NULL value for any records that references it in{' '}
        <span className="action-description-highlighter">{sourceTable ? sourceTable : '< source table name >'}</span>{' '}
        table.
      </>
    ) : (
      <>
        Deleting a record from{' '}
        <span className="action-description-highlighter">{targetTable ? targetTable : '< target table name >'}</span>{' '}
        table will set the NULL value for any records that references it in{' '}
        <span className="action-description-highlighter">{sourceTable ? sourceTable : '< source table name >'}</span>{' '}
        table.
      </>
    ),
    setDefault: isActionOnUpdate ? (
      <>
        Updating a record from{' '}
        <span className="action-description-highlighter">{targetTable ? targetTable : '< target table name >'}</span>{' '}
        table will set the default value for any records that references it in{' '}
        <span className="action-description-highlighter">{sourceTable ? sourceTable : '< source table name >'}</span>{' '}
        table.
      </>
    ) : (
      <>
        Deleting a record from{' '}
        <span className="action-description-highlighter">{targetTable ? targetTable : '< target table name >'}</span>{' '}
        table will set the default value for any records that references it in{' '}
        <span className="action-description-highlighter">{sourceTable ? sourceTable : '< source table name >'}</span>{' '}
        table.
      </>
    ),
  });

  switch (label) {
    case 'NO ACTION':
      return Description.noAction;
    case 'RESTRICT':
      return Description.restrict;
    case 'CASCADE':
      return Description.cascade;
    case 'SET NULL':
      return Description.setNull;
    case 'SET DEFAULT':
      return Description.setDefault;
    default:
      break;
  }
};

export default DataSourceSelect;
