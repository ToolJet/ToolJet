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

function CustomMenuList({ ...props }) {
  const { selectProps } = props;
  const { tjdbMenuListProps } = selectProps;

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

  const handleScrollThrottled = throttle(tjdbMenuListProps.handleInfiniteScroll, 500);
  return (
    <React.Fragment>
      <MenuList
        {...props}
        onAdd={tjdbMenuListProps.onAdd}
        addBtnLabel={tjdbMenuListProps.addBtnLabel}
        emptyError={tjdbMenuListProps.emptyError}
        foreignKeyAccess={tjdbMenuListProps.foreignKeyAccess}
        columnInfoForTable={tjdbMenuListProps.columnInfoForTable}
        showColumnInfo={tjdbMenuListProps.showColumnInfo}
        foreignKeyAccessInRowForm={tjdbMenuListProps.foreignKeyAccessInRowForm}
        scrollEventForColumnValues={tjdbMenuListProps.scrollEventForColumnValues}
        scrollContainerRef={tjdbMenuListProps.scrollContainerRef}
        foreignKeys={tjdbMenuListProps.foreignKeys}
        cellColumnName={tjdbMenuListProps.cellColumnName}
        isLoadingFKDetails={tjdbMenuListProps.isLoadingFKDetails}
        handleScrollThrottled={handleScrollThrottled}
        loader={tjdbMenuListProps.loader}
        searchValue={tjdbMenuListProps.searchValue}
        isInitialForeignKeySearchDataLoaded={tjdbMenuListProps.isInitialForeignKeySearchDataLoaded}
        isInitialForeignKeyDataLoaded={tjdbMenuListProps.isInitialForeignKeyDataLoaded}
        customChildren={tjdbMenuListProps.customChildren}
      />
      {tjdbMenuListProps.foreignKeyAccess && tjdbMenuListProps.showDescription && tjdbMenuListProps.actions && (
        <>
          <div style={{ borderTop: '1px solid var(--slate5)' }}></div>
          <div
            style={{
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
                  targetTable={
                    tjdbMenuListProps.targetTable?.value ||
                    tjdbMenuListProps.targetTable?.label ||
                    tjdbMenuListProps.targetTable?.name
                  }
                  sourceTable={tjdbMenuListProps.tableName}
                  actionName={tjdbMenuListProps.actionName}
                  label={!isEmpty(focusedOption) ? focusedOption?.label : selectedOption?.label}
                />
              }
            </span>
          </div>
        </>
      )}
      {/* Below part is hack for now to show description for aggregate function dropdown */}
      {!tjdbMenuListProps.foreignKeyAccess && !tjdbMenuListProps.actions && tjdbMenuListProps.showDescription && (
        <>
          <div style={{ borderTop: '1px solid var(--slate5)' }}></div>
          <div
            style={{
              height: 'fit-content',
              padding: '8px 12px',
              minHeight: '76px',
            }}
          >
            <div className="tj-header-h8 tj-text">
              {!isEmpty(focusedOption) ? focusedOption?.label : selectedOption?.label || ''}
            </div>
            <span className="tj-text-xsm" style={{ color: 'var(--slate9)' }}>
              {!isEmpty(focusedOption)
                ? focusedOption?.description
                : selectedOption?.description || 'Select an option to view its description'}
            </span>
          </div>
        </>
      )}
    </React.Fragment>
  );
}

const customComponents = { MenuList: CustomMenuList };

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
  scrollEventForColumnValues,
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
  cachedOptions = {},
  columnDataType = '',
  isCreateRow,
  isEditRow,
  isEditColumn,
  isCreateColumn,
  isEditTable,
  isCreateTable,
  customChildren,
  isForeignKeyInEditCell,
  closeFKMenu,
  saveFKValue,
  loader,
  isLoading = false,
  columnDefaultValue,
  setColumnDefaultValue,
  showControlComponent = false,
}) {
  const [isLoadingFKDetails, setIsLoadingFKDetails] = useState(isLoading);
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchPageNumber, setSearchPageNumber] = useState(1);
  const [totalSearchRecords, setTotalSearchRecords] = useState(0);
  const [isInitialForeignKeySearchDataLoaded, setIsInitialForeignKeySearchDataLoaded] = useState(false);
  const scrollContainerRef = useRef(null);

  const handleChangeDataSource = (source) => {
    if (source.value !== columnDefaultValue) {
      setColumnDefaultValue(false);
    } else {
      setColumnDefaultValue(true);
    }

    onSelect && onSelect(source);
    closePopup && !isMulti && closePopup();
  };

  let optionsCount = options?.length;

  options?.forEach((item) => {
    if (item?.options && item?.options?.length > 0) {
      optionsCount += item.options.length;
    }
  });

  function setDefaultStateForSearch(makeSearchValueToDefault = false) {
    setIsInitialForeignKeySearchDataLoaded(false);
    setTotalSearchRecords(0);
    setSearchPageNumber(1);
    makeSearchValueToDefault && setSearchValue('');
    setSearchResults([]);
  }

  function fetchForeignKeyDetails(page, totalRecords, isFirstPageLoaded, searchValue, foreignKeys, organizationId) {
    const limit = 15;
    const offset = (page - 1) * limit;

    if (isFirstPageLoaded && offset >= totalRecords) return;
    if (foreignKeys.length < 1) return;
    setIsLoadingFKDetails(true);
    const referencedColumns = Array.isArray(foreignKeys)
      ? foreignKeys.find((item) => item.column_names[0] === cellColumnName)
      : undefined;
    if (!referencedColumns?.referenced_column_names?.length) return;

    const selectQuery = new PostgrestQueryBuilder();
    const filterQuery = new PostgrestQueryBuilder();
    const orderQuery = new PostgrestQueryBuilder();
    selectQuery.select(referencedColumns?.referenced_column_names[0]);
    let query = `${selectQuery.url.toString()}&limit=${limit}&offset=${offset}`;

    if (!isEmpty(searchValue)) {
      columnDataType === 'character varying'
        ? filterQuery.ilike(referencedColumns?.referenced_column_names[0], `%${searchValue}%`)
        : filterQuery.eq(referencedColumns?.referenced_column_names[0], searchValue);
    }

    // Filtering out null values & bringing empty values to top
    filterQuery.is(referencedColumns?.referenced_column_names[0], 'notNull');
    orderQuery.order(referencedColumns?.referenced_column_names[0], 'nullsfirst');
    query = query + `&${filterQuery.url.toString()}&${orderQuery.url.toString()}`;

    tooljetDatabaseService
      .findOne(organizationId, referencedColumns?.referenced_table_id, query)
      .then(({ headers, data = [], error }) => {
        if (error) {
          setIsLoadingFKDetails(false);
          toast.error(
            error?.message ??
              `Failed to fetch table "${foreignKeys?.length > 0 && foreignKeys[0].referenced_table_name}"`
          );
          return;
        }

        const totalFKRecords = headers['content-range'].split('/')[1] || 0;
        if (Array.isArray(data) && data.length > 0) {
          if (isEmpty(searchValue)) {
            if (page === 1) setIsInitialForeignKeyDataLoaded(true);
            setReferencedColumnDetails((prevData) => [...prevData, ...data]);
            setPageNumber((prevPageNumber) => prevPageNumber + 1);
            if (totalRecords !== totalFKRecords) setTotalRecords(totalFKRecords);
          }

          if (!isEmpty(searchValue)) {
            if (page === 1) setIsInitialForeignKeySearchDataLoaded(true);
            const currentSearchResultList = data.map((item) => ({
              value: item[referencedColumns?.referenced_column_names[0]],
              label: item[referencedColumns?.referenced_column_names[0]],
            }));
            setSearchResults((prevSearchData) => [...prevSearchData, ...currentSearchResultList]);
            setSearchPageNumber((prevPageNumber) => prevPageNumber + 1);
            if (totalFKRecords !== totalSearchRecords) setTotalSearchRecords(totalFKRecords);
          }
        }
        setIsLoadingFKDetails(false);
      });
  }

  function handleInfiniteScroll() {
    const target = scrollContainerRef?.current;
    let scrollTop = target?.scrollTop;
    const scrollPercentage = ((scrollTop + target?.clientHeight) / target?.scrollHeight) * 100;

    if (scrollPercentage > 90 && !isLoadingFKDetails) {
      isEmpty(searchValue)
        ? fetchForeignKeyDetails(
            pageNumber,
            totalRecords,
            isInitialForeignKeyDataLoaded,
            searchValue,
            foreignKeys,
            organizationId
          )
        : fetchForeignKeyDetails(
            searchPageNumber,
            totalSearchRecords,
            isInitialForeignKeySearchDataLoaded,
            searchValue,
            foreignKeys,
            organizationId
          );
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedHandleChange = useCallback(
    debounce((value) => {
      setSearchValue(value);
    }, 500),
    []
  );

  const handleChange = (value) => {
    debouncedHandleChange(value);
  };

  useEffect(() => {
    return () => {
      debouncedHandleChange.cancel();
    };
  }, [debouncedHandleChange]);

  useEffect(() => {
    const shouldLoadFKDataFirstPage = isEmpty(searchValue) && !isInitialForeignKeyDataLoaded;
    const shouldLoadFKSearchDataFirstPage = !isEmpty(searchValue);

    if (scrollEventForColumnValues) {
      if (shouldLoadFKSearchDataFirstPage) {
        setDefaultStateForSearch();
        fetchForeignKeyDetails(1, 0, false, searchValue, foreignKeys, organizationId);
      }

      if (shouldLoadFKDataFirstPage && isEmpty(cachedOptions)) {
        fetchForeignKeyDetails(
          pageNumber,
          totalRecords,
          isInitialForeignKeyDataLoaded,
          searchValue,
          foreignKeys,
          organizationId
        );
      } else if (shouldLoadFKDataFirstPage && !isEmpty(cachedOptions)) {
        setIsLoadingFKDetails(false);
        setIsInitialForeignKeyDataLoaded(true);
        const data = cachedOptions.data;
        setReferencedColumnDetails((prevData) => [...prevData, ...data]);
        setPageNumber((prevPageNumber) => prevPageNumber + 1);
        setTotalRecords(cachedOptions.totalFKRecords);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue]);

  useEffect(() => {
    return () => {
      if (scrollEventForColumnValues) {
        setIsInitialForeignKeyDataLoaded(false);
        setTotalRecords(0);
        setPageNumber(1);
        setReferencedColumnDetails([]);

        setDefaultStateForSearch(true);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const customFilterOption = (option, inputValue) => {
    if (!option.label) return null;
    return option.label.toString().toLowerCase().includes(inputValue.toString().toLowerCase());
  };

  const handleFKMenuKeyDown = (e) => {
    if (isForeignKeyInEditCell) {
      if (e.key === 'Escape') {
        closeFKMenu();
      } else if (e.key === 'Enter') {
        saveFKValue();
      }
    }
    e.stopPropagation();
  };

  const modifiedOptions = [...options].sort((a, b) => {
    if (a.isDisabled && !b.isDisabled) return -1;
    if (!a.isDisabled && b.isDisabled) return 1;
    return 0;
  });

  return (
    <div onKeyDown={handleFKMenuKeyDown} onClick={(e) => e.stopPropagation()}>
      <Select
        onChange={(option) => {
          handleChangeDataSource(option);
        }}
        classNames={{
          menu: () =>
            isForeignKeyInEditCell
              ? 'tj-scrollbar tjdb-mainCellEdit-scrollbar'
              : foreignKeyAccess
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
        tjdbMenuListProps={{
          handleInfiniteScroll: handleInfiniteScroll,
          onAdd: onAdd,
          addBtnLabel: addBtnLabel,
          emptyError: emptyError,
          foreignKeyAccess: foreignKeyAccess,
          columnInfoForTable: columnInfoForTable,
          showColumnInfo: showColumnInfo,
          foreignKeyAccessInRowForm: foreignKeyAccessInRowForm,
          scrollEventForColumnValues: scrollEventForColumnValues,
          scrollContainerRef: scrollContainerRef,
          foreignKeys: foreignKeys,
          cellColumnName: cellColumnName,
          isLoadingFKDetails: isLoadingFKDetails,
          showDescription: showDescription,
          actions: actions,
          targetTable: targetTable,
          tableName: tableName,
          actionName: actionName,
          loader: loader,
          searchValue: searchValue,
          isInitialForeignKeySearchDataLoaded: isInitialForeignKeySearchDataLoaded,
          isInitialForeignKeyDataLoaded: isInitialForeignKeyDataLoaded,
          customChildren: customChildren,
        }}
        components={{
          Option: ({ children, ...props }) => {
            return (
              <components.Option {...props}>
                <ToolTip
                  message={`Foreign key relation cannot be created for ${props?.data?.dataType} type column`}
                  placement="top"
                  tooltipClassName="tootip-table"
                  show={
                    (foreignKeyAccess && props.data.dataType === 'serial') ||
                    props.data.dataType === 'boolean' ||
                    props.data.dataType === 'timestamp with time zone' ||
                    props.data.dataType === 'jsonb'
                  }
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

                    <ToolTip
                      message={children}
                      placement="top"
                      tooltipClassName="tjdb-cell-tooltip"
                      show={
                        (isCellEdit ||
                          isCreateRow ||
                          isEditRow ||
                          isCreateColumn ||
                          isEditColumn ||
                          isEditTable ||
                          isCreateTable) &&
                        children?.length > 30
                      }
                    >
                      <span
                        className={cx({
                          'ms-1 ': props?.data?.icon,
                          'flex-grow-1': !showDescription,
                        })}
                        style={{
                          width: '80%',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                        }}
                      >
                        {children}
                      </span>
                    </ToolTip>
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
                    <div
                      style={{ visibility: !isMulti && props.isSelected && highlightSelected ? 'visible' : 'hidden' }}
                    >
                      <SolidIcon
                        fill="var(--indigo9)"
                        name="tick"
                        style={{ height: 16, width: 16, marginTop: '-4px' }}
                        viewBox="0 0 20 20"
                        className="mx-1"
                      />
                    </div>

                    {shouldShowForeignKeyIcon && props?.data?.isTargetTable && (
                      <ToolTip
                        message={referencedForeignKeyDetails?.map(
                          (item, _index) =>
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
          ...customComponents,
          IndicatorSeparator: () => null,
          DropdownIndicator,
          GroupHeading: CustomGroupHeading,
          ...((showControlComponent ? false : optionsCount < 5) &&
            !scrollEventForColumnValues && { Control: () => '' }),
        }}
        styles={{
          control: (style) => ({
            ...style,
            background: 'var(--base)',
            color: 'var(--slate9)',
            borderWidth: '0',
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
            fontWeight: 500,
            lineHeight: '20px',
            textTransform: 'uppercase',
          }),
          option: (style, { data: { isNested }, isFocused, isDisabled, isSelected }) => ({
            ...style,
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            color: isDisabled ? 'var(--slate8, #c1c8cd)' : 'inherit',
            minHeight: '33.5px',
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
        options={scrollEventForColumnValues && searchValue ? searchResults : modifiedOptions}
        filterOption={scrollEventForColumnValues ? null : customFilterOption}
        isDisabled={isDisabled}
        isClearable={false}
        isMulti={isMulti}
        maxMenuHeight={400}
        minMenuHeight={300}
        value={selected}
        onInputChange={(value) => {
          handleChange(value);
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
  scrollEventForColumnValues,
  scrollContainerRef,
  foreignKeys,
  cellColumnName,
  isLoadingFKDetails = false,
  customChildren,
  loader,
  searchValue,
  isInitialForeignKeyDataLoaded,
  isInitialForeignKeySearchDataLoaded,
  ...props
}) => {
  const menuListStyles = getStyles('menuList', props);
  const referencedColumnDetails =
    Array.isArray(foreignKeys) && foreignKeys.find((item) => item?.column_names[0] === cellColumnName);

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
    if (scrollEventForColumnValues) menuListStyles.minHeight = 225 - 48;
  }
  menuListStyles.padding = '4px';
  const isInitialDataLoaded = isEmpty(searchValue)
    ? isInitialForeignKeyDataLoaded
    : isInitialForeignKeySearchDataLoaded;

  return (
    <>
      {!isEmpty(options) && showColumnInfo && columnInfoForTable}
      {isLoadingFKDetails && loader && !isInitialDataLoaded ? (
        loader
      ) : isEmpty(options) && emptyError && !isLoadingFKDetails ? (
        emptyError
      ) : (
        <div
          ref={scrollEventForColumnValues ? scrollContainerRef : innerRef}
          style={menuListStyles}
          id="query-ds-select-menu"
          onClick={(e) => e.stopPropagation()}
          onScroll={
            scrollEventForColumnValues && props?.handleScrollThrottled ? props.handleScrollThrottled : () => null
          }
        >
          {children}
          {isLoadingFKDetails && loader ? loader : null}
        </div>
      )}
      {customChildren && customChildren}
      {!customChildren && onAdd && !(isLoadingFKDetails && loader) && (
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
            onClick={scrollEventForColumnValues ? handleNavigateToReferencedTable : onAdd}
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
