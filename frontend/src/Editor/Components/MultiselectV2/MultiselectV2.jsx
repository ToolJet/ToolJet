import { resolveReferences } from '@/_helpers/utils';
import { useCurrentState } from '@/_stores/currentStateStore';
import _, { isEmpty } from 'lodash';
import React, { useState, useEffect, useMemo } from 'react';
import Select, { components } from 'react-select';
import './multiselectV2.scss';
import CustomMenuList from './CustomMenuList';
import CustomOption from './CustomOption';
import CustomValueContainer from './CustomValueContainer';
const { DropdownIndicator } = components;
import Loader from '@/ToolJetUI/Loader/Loader';
const tinycolor = require('tinycolor2');

const SHOW_MORE_WIDTH = 40;
const ICON_WIDTH = 16;
const SCALING_FACTOR = 0.6;
const FONT_SIZE = 12;
const GAP = 4;
const MARGIN = 26; // including left and right side margin

export const MultiselectV2 = ({
  id,
  component,
  height,
  properties,
  styles,
  exposedVariables,
  setExposedVariable,
  setExposedVariables,
  onComponentClick,
  darkMode,
  fireEvent,
  dataCy,
  validate,
  width,
}) => {
  let {
    label,
    value,
    options,
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
  const multiselectRef = React.useRef(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const validationData = validate(selected);
  const { isValid, validationError } = validationData;
  const valueContainerRef = React.useRef(null);
  const [visibleElements, setVisibleElements] = useState([]);
  const [showMore, setShowMore] = useState(false);
  const [visibility, setVisibility] = useState(properties.visibility);
  const [isMultiSelectLoading, setIsMultiSelectLoading] = useState(multiSelectLoadingState);
  const [isMultiSelectDisabled, setIsMultiSelectDisabled] = useState(disabledState);
  const [isSelectAllSelected, setIsSelectAllSelected] = useState(false);
  const _height = padding === 'default' ? `${height}px` : `${height + 4}px`;

  useEffect(() => {
    if (visibility !== properties.visibility) setVisibility(properties.visibility);
    if (isMultiSelectLoading !== multiSelectLoadingState) setIsMultiSelectLoading(multiSelectLoadingState);
    if (isMultiSelectDisabled !== disabledState) setIsMultiSelectDisabled(disabledState);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.visibility, multiSelectLoadingState, disabledState]);

  useEffect(() => {
    const updateVisibleElements = () => {
      if (!isEmpty(valueContainerRef.current)) {
        let totalWidth = 0;
        let maxVisibleOptions = 0;
        const containerWidth =
          valueContainerRef.current.offsetWidth - (iconVisibility ? ICON_WIDTH + SHOW_MORE_WIDTH : SHOW_MORE_WIDTH);
        // // Calculate total width of all span elements
        for (const option of selected) {
          const valueWidth = option.label.length * FONT_SIZE * SCALING_FACTOR + MARGIN + GAP;
          totalWidth += valueWidth;
          // Check if max row height is auto and then if any of the options width exceeds container width, return true
          if (totalWidth <= containerWidth) {
            maxVisibleOptions++;
          } else {
            break;
          }
        }
        setVisibleElements(selected.slice(0, maxVisibleOptions));
        setShowMore(selected.length > maxVisibleOptions);
      }
    };
    updateVisibleElements();
  }, [selected, width, iconVisibility]);

  const selectOptions = useMemo(() => {
    const _options = advanced ? schema : options;
    let _selectOptions = _options
      .filter((data) => data.visible)
      .map((value) => ({
        ...value,
        isDisabled: value.disable,
      }));
    return _selectOptions;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advanced, JSON.stringify(schema), JSON.stringify(options)]);

  function findDefaultItem(value, isAdvanced) {
    if (isAdvanced) {
      const foundItem = schema?.filter((item) => item?.visible && item?.default);
      return foundItem;
    }
    return selectOptions?.filter((item) => value?.find((val) => val === item.value));
  }

  function hasVisibleFalse(value) {
    for (let i = 0; i < schema?.length; i++) {
      if (schema[i].value === value && schema[i].visible === false) {
        return true;
      }
    }
    return false;
  }
  const onChangeHandler = (items) => {
    setSelected(items);
    fireEvent('onSelect');
  };

  useEffect(() => {
    let foundItem = findDefaultItem(advanced ? schema : value, advanced);
    setSelected(foundItem);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advanced, JSON.stringify(schema), JSON.stringify(value)]);

  useEffect(() => {
    setExposedVariable(
      'selectedOptions',
      selected.map(({ label, value }) => ({ label, value }))
    );
    setExposedVariable('label', label);
    setExposedVariable('options', selectOptions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(selected), label, selectOptions]);

  useEffect(() => {
    setExposedVariable('isVisible', properties.visibility);
    setExposedVariable('isLoading', multiSelectLoadingState);
    setExposedVariable('isDisabled', disabledState);
    setExposedVariable('isMandatory', isMandatory);

    setExposedVariable('setVisibility', async function (value) {
      setVisibility(value);
    });
    setExposedVariable('setLoading', async function (value) {
      setIsMultiSelectLoading(value);
    });
    setExposedVariable('setDisabled', async function (value) {
      setIsMultiSelectDisabled(value);
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.visibility, multiSelectLoadingState, disabledState, isMandatory]);

  useEffect(() => {
    // Expose selectOption
    setExposedVariable('selectOptions', async function (value) {
      if (
        selectOptions.some((option) => option.value === value) &&
        !selected.some((option) => option.value === value)
      ) {
        const newSelected = [
          ...selected,
          ...selectOptions.filter(
            (option) =>
              option.value === value && !selected.map((selectedOption) => selectedOption.value).includes(value)
          ),
        ];
        setSelected(newSelected);
        fireEvent('onSelect');
      }
    });

    // Expose deselectOption
    setExposedVariable('deselectOptions', async function (value) {
      if (selectOptions.some((option) => option.value === value) && selected.some((option) => option.value === value)) {
        const newSelected = [
          ...selected.filter(function (item) {
            return item.value !== value;
          }),
        ];
        setSelected(newSelected);
        setExposedVariable(
          'selectedOptions',
          newSelected.map(({ label, value }) => ({ label, value }))
        );
        fireEvent('onSelect');
      }
    });

    // Expose clearSelections
    setExposedVariable('clear', async function (value) {
      setSelected([]);
      fireEvent('onSelect');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, setSelected]);

  const onSearchTextChange = (searchText, actionProps) => {
    if (actionProps.action === 'input-change') {
      setExposedVariable('searchText', searchText);
      fireEvent('onSearchTextChanged');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (multiselectRef.current && !multiselectRef.current.contains(event.target)) {
        if (dropdownOpen) {
          fireEvent('onBlur');
        }
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  // Handle Select all logic
  useEffect(() => {
    if (selectOptions.length === selected.length) {
      setIsSelectAllSelected(true);
    } else {
      setIsSelectAllSelected(false);
    }
  }, [selectOptions, selected]);

  const customStyles = {
    control: (provided, state) => {
      return {
        ...provided,
        minHeight: _height,
        height: _height,
        boxShadow: state.isFocused ? boxShadow : boxShadow,
        borderRadius: Number.parseFloat(fieldBorderRadius),
        borderColor: !isValid
          ? 'var(--status-error-strong)'
          : state.isFocused
          ? accentColor != '#4368E3'
            ? accentColor
            : 'var(--primary-accent-strong)'
          : fieldBorderColor != '#CCD1D5'
          ? fieldBorderColor
          : isMultiSelectDisabled || isMultiSelectLoading
          ? '1px solid var(--borders-disabled-on-white)'
          : 'var(--borders-default)',
        '--tblr-input-border-color-darker': tinycolor(fieldBorderColor).darken(24).toString(),
        backgroundColor: !['#ffffff', '#ffffffff', '#fff'].includes(fieldBackgroundColor)
          ? fieldBackgroundColor
          : isMultiSelectDisabled || isMultiSelectLoading
          ? darkMode
            ? 'var(--surfaces-app-bg-default)'
            : 'var(--surfaces-app-bg-default)'
          : 'var(--surfaces-surface-01)',
        '&:hover': {
          borderColor: 'var(--tblr-input-border-color-darker)',
        },
      };
    },

    valueContainer: (provided, _state) => ({
      ...provided,
      height: _height,
      padding: '0 10px',
      display: 'flex',
      gap: '0.13rem',
    }),

    multiValue: (provided, _state) => ({
      ...provided,
      borderRadius: '100px',
    }),
    multiValueLabel: (provided, _state) => ({
      ...provided,
      color: disabledState ? 'grey' : selectedTextColor ? selectedTextColor : darkMode ? 'white' : 'black',
    }),
    multiValueRemove: (provided, _state) => ({
      ...provided,
      borderRadius: '100px',
      backgroundColor: '#C2C8CD',
      margin: '4px',
      padding: '2px',
      '&:hover': {
        backgroundColor: '#C2C8CD',
        color: 'unset',
      },
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
      padding: '0px',
    }),
    dropdownIndicator: (provided, _state) => ({
      ...provided,
      padding: '0px',
    }),
    option: (provided) => ({
      ...provided,
      backgroundColor:
        darkMode && ['#ffffff', '#ffffffff', '#fff'].includes(fieldBackgroundColor)
          ? 'var(--surfaces-surface-01)'
          : fieldBackgroundColor,
      color:
        selectedTextColor !== '#1B1F24'
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
      backgroundColor:
        darkMode && ['#ffffff', '#ffffffff', '#fff'].includes(fieldBackgroundColor)
          ? 'var(--surfaces-surface-01)'
          : fieldBackgroundColor,
    }),
    menu: (provided) => ({
      ...provided,
      marginTop: '5px',
    }),
  };

  const labelStyles = {
    [direction === 'alignRight' ? 'marginLeft' : 'marginRight']: label ? '1rem' : '0.001rem',
    color: labelColor !== '#1B1F24' ? labelColor : 'var(--text-primary)',
    justifyContent: direction === 'alignRight' ? 'flex-end' : 'flex-start',
  };

  const _width = (labelWidth / 100) * 70; // Max width which label can go is 70% for better UX calculate width based on this value

  return (
    <>
      <div
        className="multiselect-widget g-0"
        data-cy={dataCy}
        style={{
          display: visibility ? 'flex' : 'none',
          flexDirection: alignment === 'top' ? 'column' : direction === 'alignRight' ? 'row-reverse' : 'row',
        }}
        onFocus={() => {
          onComponentClick(this, id, component);
        }}
      >
        <div
          className="my-auto text-truncate"
          style={{
            alignSelf: direction === 'alignRight' ? 'flex-end' : 'flex-start',
            width: alignment === 'top' || auto ? 'auto' : `${_width}%`,
            // maxWidth: alignment === 'top' || auto ? '100%' : `${labelWidth}%`,
            maxWidth: alignment === 'side' ? '70%' : '100%',
          }}
        >
          <label
            style={labelStyles}
            className="font-size-12 font-weight-500 py-0 my-0 d-flex"
            data-cy={`multiselect-label-${component.name.toLowerCase()}`}
          >
            <span
              style={{
                overflow: label?.length > 18 && 'hidden', // Hide any content that overflows the box
                textOverflow: 'ellipsis', // Display ellipsis for overflowed content
                whiteSpace: 'nowrap',
                display: 'block',
              }}
            >
              {label}
            </span>
            <span style={{ color: '#DB4324', marginLeft: '1px' }}>{isMandatory && '*'}</span>
          </label>
        </div>
        <div className="w-100 px-0 h-100" ref={multiselectRef}>
          <Select
            isDisabled={isMultiSelectDisabled}
            value={selected}
            onChange={onChangeHandler}
            options={selectOptions}
            styles={customStyles}
            // Only show loading when dynamic options are enabled
            isLoading={isMultiSelectLoading}
            onInputChange={onSearchTextChange}
            onFocus={(event) => {
              onComponentClick(event, component, id);
            }}
            menuIsOpen={dropdownOpen}
            placeholder={placeholder}
            components={{
              MenuList: CustomMenuList,
              ValueContainer: CustomValueContainer,
              Option: CustomOption,
              LoadingIndicator: () => <Loader style={{ right: '11px', zIndex: 3, position: 'absolute' }} width="16" />,
              DropdownIndicator: isMultiSelectLoading ? () => null : DropdownIndicator,
            }}
            isClearable
            isMulti
            hideSelectedOptions={false}
            closeMenuOnSelect={false}
            onMenuOpen={() => {
              fireEvent('onFocus');
              setDropdownOpen(true);
            }}
            // select props
            icon={icon}
            doShowIcon={iconVisibility}
            containerRef={valueContainerRef}
            visibleValues={visibleElements}
            showMore={showMore}
            setShowMore={setShowMore}
            showAllOption={showAllOption}
            isSelectAllSelected={isSelectAllSelected}
            setIsSelectAllSelected={setIsSelectAllSelected}
            setSelected={setSelected}
            iconColor={iconColor}
            optionsLoadingState={optionsLoadingState}
            darkMode={darkMode}
          />
        </div>
      </div>
      <div
        className={`invalid-feedback ${isValid ? '' : visibility ? 'd-flex' : 'none'}`}
        style={{
          color: errTextColor,
          justifyContent: direction === 'alignRight' ? 'flex-start' : 'flex-end',
          marginTop: alignment === 'top' ? '1.25rem' : '0.25rem',
        }}
      >
        {!isValid && validationError}
      </div>
    </>
  );
};
