import React, { isValidElement, useCallback, useState, useRef, useEffect } from 'react';
import Select, { components } from 'react-select';
import { isEmpty, debounce } from 'lodash';
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
}) {
  const [loadingForeignKey, setLoadingForeignkey] = useState(false);
  const [totalRecords, setTotalRecords] = useState(1);
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

  const getForeignKeyDetails = (add) => {
    setLoadingForeignkey(true);
    const selectQuery = new PostgrestQueryBuilder();
    const referencedColumns = foreignKeys?.find((item) => item.column_names[0] === cellColumnName);
    selectQuery.select(referencedColumns?.referenced_column_names[0]);
    const limit = 15;
    const offset = (totalRecords - 1) * limit;
    tooljetDatabaseService
      .findOne(
        organizationId,
        foreignKeys?.length > 0 && foreignKeys[0]?.referenced_table_id,
        `${selectQuery.url.toString()}&limit=${limit}&offset=${offset}`
      )
      .then(({ headers, data = [], error }) => {
        if (error) {
          toast.error(
            error?.message ??
              `Failed to fetch table "${foreignKeys?.length > 0 && foreignKeys[0].referenced_table_name}"`
          );
          setLoadingForeignkey(false);
          return;
        }

        if (Array.isArray(data) && data?.length > 0) {
          setTotalRecords((prevTotalRecords) => prevTotalRecords + add);
          setReferencedColumnDetails((prevData) => [...prevData, ...data]);
          setLoadingForeignkey(false);
          // console.log('first', 1);
        }
      });
  };

  // const handleScroll = (event) => {
  //   const target = scrollContainerRef?.current;
  //   let scrollTop = target?.scrollTop;
  //   console.log('scroll', loadingForeignKey);
  //   const scrollPercentage = ((scrollTop + target?.clientHeight) / target?.scrollHeight) * 100;

  //   if (scrollPercentage > 98 && !loadingForeignKey) {
  //     getForeignKeyDetails(1);
  //   }
  // };
  // // scrollContainerRef?.current?.addEventListener('scroll', handleScroll);

  useEffect(() => {
    if (scrollEventForColumnValus) {
      getForeignKeyDetails(1);
    }

    // console.log('first', foreignKeys);
  }, []);

  return (
    <div>
      <Select
        onClick={(e) => e.stopPropagation()}
        onChange={(option) => handleChangeDataSource(option)}
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
        hideSelectedOptions={false}
        components={{
          // ...(isMulti && {
          Option: ({ children, ...props }) => {
            return (
              <components.Option {...props}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: showRedirection || showDescription ? 'space-between' : 'flex-start',
                    alignItems: 'center',
                  }}
                  className="dd-select-option"
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
                    {foreignKeyAccess && showDescription && (
                      <span className="action-description">{props.data.label}</span>
                    )}
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
                    <SolidIcon name="foreignkey" height={'14'} width={'24'} />
                  )}
                </div>
              </components.Option>
            );
          },
          // }),
          MenuList: useCallback(
            (props) => (
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
                getForeignKeyDetails={getForeignKeyDetails}
                loadingForeignKey={loadingForeignKey}
                scrollContainerRef={scrollContainerRef}
              />
            ),
            [onAdd, addBtnLabel, emptyError]
          ),
          IndicatorSeparator: () => null,
          DropdownIndicator,
          GroupHeading: CustomGroupHeading,
          ...(optionsCount < 5 && { Control: () => '' }),
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
            cursor: 'pointer',
            color: 'inherit',
            backgroundColor:
              isSelected && highlightSelected
                ? 'var(--indigo3, #F0F4FF)'
                : isFocused && !isNested
                ? 'var(--slate4)'
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
            // border: '1px solid var(--slate3)',
            // boxShadow: '0px 2px 4px -2px rgba(16, 24, 40, 0.06), 0px 4px 8px -2px rgba(16, 24, 40, 0.10)',
          }),
          valueContainer: (styles) => ({
            ...styles,
            paddingLeft: 0,
          }),
        }}
        placeholder="Search"
        options={options}
        isDisabled={isDisabled}
        isClearable={false}
        // menuIsOpen
        isMulti={isMulti}
        maxMenuHeight={400}
        minMenuHeight={300}
        value={selected}
        // onKeyDown={handleKeyDown}
        onInputChange={() => {
          const _queryDsSelectMenu = document.getElementById('query-ds-select-menu');
          // if (queryDsSelectMenu && !queryDsSelectMenu?.style?.height) {
          //   queryDsSelectMenu.style.height = queryDsSelectMenu.offsetHeight + 'px';
          // }
        }}
        // filterOption={(data, search) => {
        //   if (data?.data?.source) {
        //     //Disabled below eslint check since already checking in above line)
        //     // eslint-disable-next-line no-unsafe-optional-chaining
        //     const { name, kind } = data?.data?.source;
        //     const searchTerm = search.toLowerCase();
        //     return name.toLowerCase().includes(searchTerm) || kind.toLowerCase().includes(searchTerm);
        //   }
        //   return true;
        // }}
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
  getForeignKeyDetails,
  loadingForeignKey,
  scrollContainerRef,
  ...props
}) => {
  const menuListStyles = getStyles('menuList', props);

  const { admin } = authenticationService.currentSessionValue;
  if (admin) {
    //offseting for height of button since react-select calculates only the size of options list
    menuListStyles.maxHeight = 225 - 48;
  }
  menuListStyles.padding = '4px';

  return (
    <>
      {!isEmpty(options) && showColumnInfo && columnInfoForTable}
      {isEmpty(options) && emptyError ? (
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
          <ButtonSolid variant="secondary" size="md" className="w-100" onClick={onAdd}>
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

export default DataSourceSelect;
