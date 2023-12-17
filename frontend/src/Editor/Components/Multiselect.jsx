import { resolveReferences } from '@/_helpers/utils';
import { useCurrentState } from '@/_stores/currentStateStore';
import _, { isEmpty } from 'lodash';
import React, { useState, useEffect, useMemo } from 'react';
import Select, { components } from 'react-select';
import * as Icons from '@tabler/icons-react';
import { CustomMenuList } from './Table/SelectComponent';
import { Checkbox } from '@/_ui/CheckBox';
import { FormCheck } from 'react-bootstrap';
import { useMeasure } from 'react-use';
const { ValueContainer, SingleValue, Placeholder, MultiValue } = components;
import './multiselect.scss';

const CustomValueContainer = ({ children, ...props }) => {
  const selectProps = props.selectProps;
  // eslint-disable-next-line import/namespace
  const IconElement = Icons[selectProps?.icon] == undefined ? Icons['IconHome2'] : Icons[selectProps?.icon];
  const showNoRemainingOpt = props.getValue().length - selectProps.visibleValues.length;
  return (
    <ValueContainer {...props}>
      <span ref={selectProps.containerRef} className="d-flex w-full">
        {selectProps?.doShowIcon && (
          <IconElement
            style={{
              width: '16px',
              height: '16px',
              fill: 'var(--slate8)',
            }}
          />
        )}
        {!props.hasValue ? (
          <Placeholder {...props} key="placeholder" {...selectProps} data={selectProps?.visibleValues}>
            {selectProps.placeholder}
          </Placeholder>
        ) : (
          <span className="d-flex">
            {selectProps?.visibleValues.map((element, index) => (
              <div className="value-container-selected-option" key={index}>
                {element.label}
              </div>
            ))}
            {showNoRemainingOpt !== 0 && (
              <div className="value-container-selected-option">{`+${showNoRemainingOpt}`}</div>
            )}
          </span>
        )}
      </span>
    </ValueContainer>
  );
};

const Option = (props) => {
  return (
    <components.Option {...props}>
      <div className="d-flex">
        <FormCheck checked={props.isSelected} />
        <span style={{ marginLeft: '4px' }}>{props.label}</span>
      </div>
    </components.Option>
  );
};

export const Multiselect = function Multiselect({
  id,
  component,
  height,
  properties,
  styles,
  exposedVariables,
  setExposedVariable,
  onComponentClick,
  darkMode,
  fireEvent,
  dataCy,
  validate,
  width,
}) {
  let {
    label,
    value,
    values,
    display_values,
    showAllOption,
    disabledState,
    advanced,
    schema,
    placeholder,
    dropdownLoadingState,
  } = properties;
  const {
    selectedTextColor,
    borderRadius,
    justifyContent,
    boxShadow,
    labelColor,
    alignment,
    direction,
    fieldBorderColor,
    fieldBackgroundColor,
    labelWidth,
    icon,
    iconVisibility,
    errTextColor,
  } = styles;
  const [selected, setSelected] = useState([]);
  const [searched, setSearched] = useState('');
  const currentState = useCurrentState();
  const isMandatory = resolveReferences(component?.definition?.validation?.mandatory?.value, currentState);
  const ref1 = React.useRef(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const validationData = validate(selected);
  const { isValid, validationError } = validationData;
  const ref = React.useRef(null);
  const [visibleElements, setVisibleElements] = useState([]);
  const [showMore, setShowMore] = useState(false);
  const [visibility, setVisibility] = useState(properties.visibility);
  const [isDropdownLoading, setIsDropdownLoading] = useState(dropdownLoadingState);
  const [isDropdownDisabled, setIsDropdownDisabled] = useState(disabledState);

  useEffect(() => {
    if (visibility !== properties.visibility) setVisibility(properties.visibility);
    if (isDropdownLoading !== dropdownLoadingState) setIsDropdownLoading(dropdownLoadingState);
    if (isDropdownDisabled !== disabledState) setIsDropdownDisabled(disabledState);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.visibility, dropdownLoadingState, disabledState]);

  useEffect(() => {
    const updateVisibleElements = () => {
      if (!isEmpty(ref.current)) {
        const containerWidth = ref.current.clientWidth;
        const elementWidth = 54;
        const maxVisibleElements = Math.floor(containerWidth / elementWidth);
        // console.log(containerWidth, 'containerWidth', maxVisibleElements);
        setVisibleElements(selected.slice(0, maxVisibleElements));
        setShowMore(selected.length > maxVisibleElements);
      }
    };
    updateVisibleElements();
  }, [selected, width]);

  const selectOptions = useMemo(() => {
    let _selectOptions = advanced
      ? schema
          .filter((data) => data.visible)
          .map((value) => ({
            ...value,
            isDisabled: value.disable,
          }))
      : values
          .map((value, index) => {
            if (true) {
              return { label: display_values[index], value: value, isDisabled: false };
            }
          })
          .filter((option) => option);

    return _selectOptions;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advanced, JSON.stringify(schema), JSON.stringify(display_values), JSON.stringify(values)]);

  function findDefaultItem(value, isAdvanced) {
    if (isAdvanced) {
      const foundItem = schema?.filter((item) => item?.visible && item?.default);
      return foundItem;
    }
    return selectOptions?.filter((item) => value?.find((val) => val === item.value));
  }

  // console.log(visibleElements, showMore, width, 'selected');

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
      'values',
      selected.map((item) => item.value)
    );
    setExposedVariable('label', label);
    setExposedVariable('options', selectOptions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(selected), label, selectOptions]);

  useEffect(() => {
    setExposedVariable('isVisible', properties.visibility);
    setExposedVariable('isLoading', dropdownLoadingState);
    setExposedVariable('isDisabled', disabledState);
    setExposedVariable('isMandatory', isMandatory);

    setExposedVariable('setVisibility', async function (value) {
      setVisibility(value);
    });
    setExposedVariable('setLoading', async function (value) {
      setIsDropdownLoading(value);
    });
    setExposedVariable('setDisabled', async function (value) {
      setIsDropdownDisabled(value);
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.visibility, dropdownLoadingState, disabledState, isMandatory]);

  useEffect(() => {
    // Expose selectOption
    setExposedVariable('selectOption', async function (value) {
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
    setExposedVariable('deselectOption', async function (value) {
      if (selectOptions.some((option) => option.value === value) && selected.some((option) => option.value === value)) {
        const newSelected = [
          ...selected.filter(function (item) {
            return item.value !== value;
          }),
        ];
        setSelected(newSelected);
        setExposedVariable(
          'values',
          newSelected.map((item) => item.value)
        );
        fireEvent('onSelect');
      }
    });

    // Expose clearSelections
    setExposedVariable('clearSelections', async function (value) {
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
      if (ref1.current && !ref1.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const customStyles = {
    control: (provided, state) => {
      return {
        ...provided,
        minHeight: height,
        height: height,
        boxShadow: state.isFocused ? boxShadow : boxShadow,
        borderRadius: Number.parseFloat(borderRadius),
        borderColor: !isValid ? 'var(--tj-text-input-widget-error)' : fieldBorderColor,
        backgroundColor: fieldBackgroundColor,
        '&:hover': {
          backgroundColor: fieldBackgroundColor,
          borderColor: '#3E63DD',
        },
      };
    },

    valueContainer: (provided, _state) => ({
      ...provided,
      height: height,
      padding: '0 6px',
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
      height: height,
    }),
    clearIndicator: (provided, _state) => ({
      ...provided,
      padding: '0px',
    }),
    dropdownIndicator: (provided, _state) => ({
      ...provided,
      padding: '0px',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: 'white',
      color: '#11181C',
      '&:hover': {
        backgroundColor: '#3E63DD',
        color: 'white',
      },
    }),
  };

  const labelStyles = {
    marginRight: label !== '' ? '1rem' : '0.001rem',
    color: labelColor,
    alignSelf: direction === 'alignRight' ? 'flex-end' : 'flex-start',
  };

  if (isDropdownLoading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ width: '100%', height }}>
        <center>
          <div className="spinner-border" role="status"></div>
        </center>
      </div>
    );
  }
  return (
    <>
      <div
        className="multiselect-widget g-0"
        data-cy={dataCy}
        style={{
          height,
          display: visibility ? 'flex' : 'none',
          flexDirection: alignment === 'top' ? 'column' : direction === 'alignRight' ? 'row-reverse' : 'row',
        }}
        onFocus={() => {
          onComponentClick(this, id, component);
        }}
      >
        <div className="col-auto my-auto" style={{ alignSelf: direction === 'alignRight' ? 'flex-end' : 'flex-start' }}>
          <label
            style={labelStyles}
            className="form-label py-0 my-0"
            data-cy={`multiselect-label-${component.name.toLowerCase()}`}
          >
            {label}
            <span style={{ color: '#DB4324', marginLeft: '1px' }}>{isMandatory && '*'}</span>
          </label>
        </div>
        <div className="col px-0 h-100" ref={ref1}>
          <Select
            isDisabled={isDropdownDisabled}
            value={selected}
            onChange={onChangeHandler}
            options={selectOptions}
            styles={customStyles}
            // Only show loading when dynamic options are enabled
            isLoading={advanced && properties.loadingState}
            onInputChange={onSearchTextChange}
            onFocus={(event) => {
              onComponentClick(event, component, id);
            }}
            menuIsOpen={dropdownOpen}
            onBlur={() => setDropdownOpen(false)}
            menuPortalTarget={document.body}
            placeholder={placeholder}
            components={{
              MenuList: CustomMenuList,
              ValueContainer: CustomValueContainer,
              Option,
              Input: () => null,
            }}
            isClearable
            isMulti
            hideSelectedOptions={false}
            closeMenuOnSelect={false}
            icon={icon}
            doShowIcon={iconVisibility}
            onMenuOpen={() => setDropdownOpen(true)}
            containerRef={ref}
            visibleValues={visibleElements}
            showMore={showMore}
            setShowMore={setShowMore}
          />
        </div>
      </div>
      <div
        className={`invalid-feedback ${isValid ? '' : visibility ? 'd-flex' : 'none'}`}
        style={{
          color: errTextColor,
          justifyContent: direction === 'alignRight' ? 'flex-end' : 'flex-start',
          marginTop: alignment === 'top' ? '1.25rem' : '0.25rem',
        }}
      >
        {!isValid && validationError}
      </div>
    </>
  );
};
