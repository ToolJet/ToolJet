import React, { isValidElement, useCallback, useState } from 'react';
import Select, { components } from 'react-select';
import { isEmpty } from 'lodash';
import { authenticationService } from '@/_services';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import Search from '@/_ui/Icon/solidIcons/Search';
import { Form } from 'react-bootstrap';
import SolidIcon from '@/_ui/Icon/SolidIcons';

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
}) {
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

  return (
    <div>
      <Select
        onChange={(option) => handleChangeDataSource(option)}
        classNames={{
          menu: () => 'tj-scrollbar',
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
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                  }}
                  className="dd-select-option"
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      // width: '20px',
                    }}
                  >
                    {isMulti && (
                      <Form.Check // prettier-ignore
                        type={'checkbox'}
                        id={props.value}
                        className="me-1"
                        checked={props.isSelected}
                        // label={`default ${type}`}
                      />
                    )}
                  </div>
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
                  <span className={`${props?.data?.icon ? 'ms-1 ' : ''}flex-grow-1`}>{children}</span>
                  {props.isSelected && (
                    <SolidIcon
                      fill="var(--indigo9)"
                      name="tick"
                      style={{ height: 16, width: 16 }}
                      viewBox="0 0 20 20"
                    />
                  )}
                </div>
              </components.Option>
            );
          },
          // }),
          MenuList: useCallback(
            (props) => <MenuList {...props} onAdd={onAdd} addBtnLabel={addBtnLabel} emptyError={emptyError} />,
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
            backgroundColor: isSelected
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

const MenuList = ({ children, getStyles, innerRef, onAdd, addBtnLabel, emptyError, options, ...props }) => {
  const menuListStyles = getStyles('menuList', props);
  const { admin } = authenticationService.currentSessionValue;
  if (admin) {
    //offseting for height of button since react-select calculates only the size of options list
    menuListStyles.maxHeight = 225 - 48;
  }
  menuListStyles.padding = '4px';

  return (
    <>
      {isEmpty(options) && emptyError ? (
        emptyError
      ) : (
        <div ref={innerRef} style={menuListStyles} id="query-ds-select-menu">
          {children}
        </div>
      )}
      {onAdd && (
        <div className="p-2 mt-2 border-slate3-top">
          <ButtonSolid variant="secondary" size="md" className="w-100" onClick={onAdd}>
            + {addBtnLabel || 'Add new'}
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
