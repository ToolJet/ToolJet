import { resolveReferences } from '@/_helpers/utils';
import { useCurrentState } from '@/_stores/currentStateStore';
import _, { has, isEmpty, isObject } from 'lodash';
import React, { useState, useEffect, useMemo } from 'react';
import Select from 'react-select';
import './multiselectV2.scss';
import CustomMenuList from '../DropdownV2/CustomMenuList';
import { useEditorStore } from '@/_stores/editorStore';
import CustomOption from './CustomOption';
import CustomValueContainer from './CustomValueContainer';
import Loader from '@/ToolJetUI/Loader/Loader';
import cx from 'classnames';
import Label from '@/_ui/Label';
const tinycolor = require('tinycolor2');
import { CustomDropdownIndicator, CustomClearIndicator } from '../DropdownV2/DropdownV2';
import { getInputBackgroundColor, getInputBorderColor, getInputFocusedColor } from '../DropdownV2/utils';

export const MultiselectV2 = ({
  id,
  component,
  height,
  properties,
  styles,
  setExposedVariable,
  setExposedVariables,
  onComponentClick,
  darkMode,
  fireEvent,
  validate,
  width,
}) => {
  let {
    label,
    showAllOption,
    disabledState,
    advanced,
    schema,
    placeholder,
    loadingState: multiSelectLoadingState,
    optionsLoadingState,
  } = properties;
  const {
    selectedTextColor,
    fieldBorderRadius,
    boxShadow,
    labelColor,
    alignment,
    direction,
    fieldBorderColor,
    fieldBackgroundColor,
    labelWidth,
    auto,
    icon,
    iconVisibility,
    errTextColor,
    iconColor,
    padding,
    accentColor,
  } = styles;
  const [selected, setSelected] = useState([]);
  const currentState = useCurrentState();
  const isMandatory = resolveReferences(component?.definition?.validation?.mandatory?.value, currentState);
  const options = component?.definition?.properties?.options?.value;
  const values = component?.definition?.properties?.values?.value;
  const multiselectRef = React.useRef(null);
  const labelRef = React.useRef(null);
  const validationData = validate(selected?.length ? selected?.map((option) => option.value) : null);
  const { isValid, validationError } = validationData;
  const valueContainerRef = React.useRef(null);
  const [visibility, setVisibility] = useState(properties.visibility);
  const [isMultiSelectLoading, setIsMultiSelectLoading] = useState(multiSelectLoadingState);
  const [isMultiSelectDisabled, setIsMultiSelectDisabled] = useState(disabledState);
  const [isSelectAllSelected, setIsSelectAllSelected] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState('');
  const _height = padding === 'default' ? `${height}px` : `${height + 4}px`;

  const [isMultiselectOpen, setIsMultiselectOpen] = useState(false);
  useEffect(() => {
    if (visibility !== properties.visibility) setVisibility(properties.visibility);
    if (isMultiSelectLoading !== multiSelectLoadingState) setIsMultiSelectLoading(multiSelectLoadingState);
    if (isMultiSelectDisabled !== disabledState) setIsMultiSelectDisabled(disabledState);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.visibility, multiSelectLoadingState, disabledState]);

  const selectOptions = useMemo(() => {
    const _options = advanced ? schema : options;
    let _selectOptions = Array.isArray(_options)
      ? _options
          .filter((data) => resolveReferences(advanced ? data?.visible : data?.visible?.value, currentState))
          .map((data) => ({
            ...data,
            label: resolveReferences(data?.label, currentState),
            value: resolveReferences(data?.value, currentState),
            isDisabled: resolveReferences(advanced ? data?.disable : data?.disable?.value, currentState),
          }))
      : [];
    return _selectOptions;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advanced, JSON.stringify(schema), JSON.stringify(options)]);

  function findDefaultItem(value, isAdvanced, isDefault) {
    if (isAdvanced) {
      const foundItem = Array.isArray(schema) ? schema.filter((item) => item?.visible && item?.default) : [];
      return foundItem;
    }
    if (isDefault) {
      return Array.isArray(selectOptions)
        ? selectOptions.filter((item) => value?.find((val) => val === item.value))
        : [];
    } else {
      return Array.isArray(selectOptions)
        ? selectOptions.filter((item) => selected?.find((val) => val.value === item.value))
        : [];
    }
  }

  function hasVisibleFalse(value) {
    for (let i = 0; i < schema?.length; i++) {
      if (schema[i].value === value && schema[i].visible === false) {
        return true;
      }
    }
    return false;
  }
  const onChangeHandler = (items, action) => {
    setSelected(items);
    if (action.action === 'select-option') {
      fireEvent('onSelect');
    }
  };
  useEffect(() => {
    let foundItem = findDefaultItem(values, advanced);
    setSelected(foundItem);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectOptions]);

  useEffect(() => {
    let foundItem = findDefaultItem(values, advanced, true);
    setSelected(foundItem);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advanced, JSON.stringify(schema), JSON.stringify(values)]);

  useEffect(() => {
    setExposedVariable(
      'selectedOptions',
      Array.isArray(selected) && selected?.map(({ label, value }) => ({ label, value }))
    );
    setExposedVariable(
      'options',
      Array.isArray(selectOptions) && selectOptions?.map(({ label, value }) => ({ label, value }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(selected), selectOptions]);

  useEffect(() => {
    setExposedVariable('label', label);
    setExposedVariable('isVisible', properties.visibility);
    setExposedVariable('isLoading', multiSelectLoadingState);
    setExposedVariable('isDisabled', disabledState);
    setExposedVariable('isMandatory', isMandatory);
    setExposedVariable('isValid', isValid);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [label, properties.visibility, multiSelectLoadingState, disabledState, isMandatory, isValid]);

  useEffect(() => {
    const exposedVariables = {
      clear: async function () {
        setSelected([]);
      },
      setVisibility: async function (value) {
        setVisibility(value);
      },
      setLoading: async function (value) {
        setIsMultiSelectLoading(value);
      },
      setDisable: async function (value) {
        setIsMultiSelectDisabled(value);
      },
    };
    setExposedVariables(exposedVariables);
  }, []);

  useEffect(() => {
    // Expose selectOption
    setExposedVariable('selectOptions', async function (value) {
      if (Array.isArray(value)) {
        const newSelected = [...selected];
        value.forEach((val) => {
          // Check if array provided is a list of objects with value key
          if (isObject(val) && has(val, 'value')) {
            val = val.value;
          }
          if (
            selectOptions.some((option) => option.value === val) &&
            !selected.some((option) => option.value === val)
          ) {
            const optionsToAdd = selectOptions.filter(
              (option) => option.value === val && !selected.some((selectedOption) => selectedOption.value === val)
            );
            newSelected.push(...optionsToAdd);
          }
        });
        setSelected(newSelected);
      }
    });

    // Expose deselectOption
    setExposedVariable('deselectOptions', async function (value) {
      if (Array.isArray(value)) {
        // Check if array provided is a list of objects with value key
        const _value = value.map((val) => (isObject(val) && has(val, 'value') ? val.value : val));
        const newSelected = selected.filter((option) => !_value.includes(option.value));
        setSelected(newSelected);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectOptions, selected, setSelected]);

  const onSearchTextChange = (searchText, actionProps) => {
    if (actionProps.action === 'input-change') {
      setSearchInputValue(searchText);
      setExposedVariable('searchText', searchText);
      fireEvent('onSearchTextChanged');
    }
  };
  const handleClickOutside = (event) => {
    let menu = document.getElementById(`dropdown-multiselect-widget-custom-menu-list-${id}`);
    if (
      multiselectRef.current &&
      !multiselectRef.current.contains(event.target) &&
      menu &&
      !menu.contains(event.target)
    ) {
      if (isMultiselectOpen) {
        fireEvent('onBlur');
        setIsMultiselectOpen(false);
        setSearchInputValue('');
      }
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside, { capture: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, { capture: true });
    };
  }, [isMultiselectOpen]);

  // Handle Select all logic
  useEffect(() => {
    if (selectOptions?.length === selected?.length) {
      setIsSelectAllSelected(true);
    } else {
      setIsSelectAllSelected(false);
    }
  }, [selectOptions, selected]);

  const customStyles = {
    container: (base) => ({
      ...base,
      width: '100%',
      minWidth: '72px',
    }),
    control: (provided, state) => {
      return {
        ...provided,
        minHeight: _height,
        height: _height,
        boxShadow: state.isFocused ? boxShadow : boxShadow,
        borderRadius: Number.parseFloat(fieldBorderRadius),
        borderColor: getInputBorderColor({
          isFocused: state.isFocused || isMultiselectOpen,
          isValid,
          fieldBorderColor,
          accentColor,
          isLoading: isMultiSelectLoading,
          isDisabled: isMultiSelectDisabled,
        }),
        backgroundColor: getInputBackgroundColor({
          fieldBackgroundColor,
          darkMode,
          isLoading: isMultiSelectLoading,
          isDisabled: isMultiSelectDisabled,
        }),
        '&:hover': {
          borderColor:
            state.isFocused || isMultiselectOpen
              ? getInputFocusedColor({ accentColor })
              : tinycolor(fieldBorderColor).darken(24).toString(),
        },
      };
    },
    valueContainer: (provided, _state) => ({
      ...provided,
      height: _height,
      padding: '0 10px',
      display: 'flex',
      gap: '0.13rem',
      color:
        selectedTextColor !== '#1B1F24'
          ? selectedTextColor
          : isMultiSelectLoading || isMultiSelectDisabled
          ? 'var(--text-disabled)'
          : 'var(--text-primary)',
    }),

    input: (provided, _state) => ({
      ...provided,
      color: darkMode ? 'white' : 'black',
      margin: '0px',
    }),
    indicatorSeparator: (_state) => ({
      display: 'none',
    }),
    indicatorsContainer: (provided, _state) => ({
      ...provided,
      height: _height,
      marginRight: '10px',
    }),
    clearIndicator: (provided, _state) => ({
      ...provided,
      padding: '2px',
      '&:hover': {
        padding: '2px',
        backgroundColor: 'var(--interactive-overlays-fill-hover)',
        borderRadius: '6px',
      },
    }),
    dropdownIndicator: (provided, _state) => ({
      ...provided,
      padding: '0px',
    }),
    option: (provided, _state) => ({
      ...provided,
      backgroundColor: 'var(--surfaces-surface-01)',
      color: _state.isDisabled
        ? 'var(_--text-disbled)'
        : selectedTextColor !== '#1B1F24'
        ? selectedTextColor
        : isMultiSelectDisabled || isMultiSelectLoading
        ? 'var(--text-disabled)'
        : 'var(--text-primary)',
      padding: '8px 6px 8px 12px',
      '&:hover': {
        backgroundColor: 'var(--interactive-overlays-fill-hover)',
        borderRadius: '8px',
      },
      cursor: 'pointer',
    }),
    menuList: (provided) => ({
      ...provided,
      padding: '4px',
      // this is needed otherwise :active state doesn't look nice, gap is required
      display: 'flex',
      flexDirection: 'column',
      gap: '4px !important',
      overflowY: 'auto',
      backgroundColor: 'var(--surfaces-surface-01)',
    }),
    menu: (provided) => ({
      ...provided,
      marginTop: '5px',
    }),
  };
  const _width = (labelWidth / 100) * 70; // Max width which label can go is 70% for better UX calculate width based on this value

  return (
    <>
      <div
        ref={multiselectRef}
        data-cy={`label-${String(component.name).toLowerCase()} `}
        className={cx('multiselect-widget', 'd-flex', {
          [alignment === 'top' &&
          ((labelWidth != 0 && label?.length != 0) || (auto && labelWidth == 0 && label && label?.length != 0))
            ? 'flex-column'
            : 'align-items-center']: true,
          'flex-row-reverse': direction === 'right' && alignment === 'side',
          'text-right': direction === 'right' && alignment === 'top',
          invisible: !visibility,
          visibility: visibility,
        })}
        style={{
          position: 'relative',
          whiteSpace: 'nowrap',
          width: '100%',
        }}
        onMouseDown={(event) => {
          onComponentClick(id, component, event);
          // This following line is needed because sometimes after clicking on canvas then also dropdown remains selected
          useEditorStore.getState().actions.setHoveredComponent('');
        }}
      >
        <Label
          label={label}
          width={labelWidth}
          labelRef={labelRef}
          darkMode={darkMode}
          color={labelColor}
          defaultAlignment={alignment}
          direction={direction}
          auto={auto}
          isMandatory={isMandatory}
          _width={_width}
        />
        <div
          className="w-100 px-0 h-100"
          onClick={() => {
            if (!isMultiSelectDisabled) {
              fireEvent('onFocus');
            }
            setIsMultiselectOpen(!isMultiselectOpen);
          }}
        >
          <Select
            menuId={id}
            isDisabled={isMultiSelectDisabled}
            value={selected}
            onChange={onChangeHandler}
            options={selectOptions}
            styles={customStyles}
            // Only show loading when dynamic options are enabled
            isLoading={isMultiSelectLoading}
            onInputChange={onSearchTextChange}
            inputValue={searchInputValue}
            menuIsOpen={isMultiselectOpen}
            placeholder={placeholder}
            components={{
              MenuList: CustomMenuList,
              ValueContainer: CustomValueContainer,
              Option: CustomOption,
              LoadingIndicator: () => <Loader style={{ right: '11px', zIndex: 3, position: 'absolute' }} width="16" />,
              ClearIndicator: CustomClearIndicator,
              DropdownIndicator: isMultiSelectLoading ? () => null : CustomDropdownIndicator,
            }}
            isClearable
            isMulti
            hideSelectedOptions={false}
            closeMenuOnSelect={false}
            onMenuOpen={() => {
              fireEvent('onFocus');
              setIsMultiselectOpen(true);
            }}
            // select props
            icon={icon}
            doShowIcon={iconVisibility}
            containerRef={valueContainerRef}
            showAllOption={showAllOption}
            isSelectAllSelected={isSelectAllSelected}
            setIsSelectAllSelected={setIsSelectAllSelected}
            setSelected={setSelected}
            iconColor={iconColor}
            optionsLoadingState={optionsLoadingState}
            darkMode={darkMode}
            fireEvent={() => fireEvent('onSelect')}
            menuPlacement="auto"
            menuPortalTarget={document.body}
          />
        </div>
      </div>
      <div
        className={`${isValid ? '' : visibility ? 'd-flex' : 'none'}`}
        style={{
          color: errTextColor,
          justifyContent: direction === 'right' ? 'flex-start' : 'flex-end',
          fontSize: '11px',
          fontWeight: '400',
          lineHeight: '16px',
          display: visibility ? 'block' : 'none',
        }}
      >
        {!isValid && validationError}
      </div>
    </>
  );
};
