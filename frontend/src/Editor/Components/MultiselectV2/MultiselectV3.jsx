import { resolveReferences } from '@/_helpers/utils';
import { useCurrentState } from '@/_stores/currentStateStore';
import _, { isEmpty } from 'lodash';
import React, { useState, useEffect, useMemo } from 'react';
import Select, { components } from 'react-select';
import * as Icons from '@tabler/icons-react';
import { FormCheck, OverlayTrigger, Popover } from 'react-bootstrap';
const { ValueContainer, Placeholder, MenuList, Option } = components;
import SolidIcon from '@/_ui/Icon/SolidIcons';
import './multiselectV2.scss';
import RemoveCircle from '@/_ui/Icon/bulkIcons/RemoveCircle';

const SHOW_MORE_WIDTH = 40;
const ICON_WIDTH = 16;

const CustomMenuList = ({ selectProps, ...props }) => {
  const {
    onInputChange,
    inputValue,
    onMenuInputFocus,
    showAllOption,
    isSelectAllSelected,
    setIsSelectAllSelected,
    setSelected,
  } = selectProps;

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelected(props.options);
    } else {
      setSelected([]);
    }
    setIsSelectAllSelected(e.target.checked);
  };
  return (
    <div className="multiselect-custom-menu-list" onClick={(e) => e.stopPropagation()}>
      <div className="table-select-column-type-search-box-wrapper ">
        {!inputValue && (
          <span className="">
            <SolidIcon name="search" width="14" />
          </span>
        )}
        <input
          autoCorrect="off"
          autoComplete="off"
          spellCheck="false"
          type="text"
          value={inputValue}
          onChange={(e) =>
            onInputChange(e.currentTarget.value, {
              action: 'input-change',
            })
          }
          onMouseDown={(e) => {
            e.stopPropagation();
            e.target.focus();
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
            e.target.focus();
          }}
          onFocus={onMenuInputFocus}
          placeholder="Search..."
          className="table-select-column-type-search-box"
        />
      </div>
      {showAllOption && (
        <div className="multiselect-custom-menulist-select-all">
          <FormCheck checked={isSelectAllSelected} onChange={handleSelectAll} />
          <span style={{ marginLeft: '4px' }}>Select all</span>
        </div>
      )}
      <MenuList {...props} selectProps={selectProps} />
    </div>
  );
};

const CustomValueContainer = ({ ...props }) => {
  const selectProps = props.selectProps;
  // eslint-disable-next-line import/namespace
  const IconElement = Icons[selectProps?.icon] == undefined ? Icons['IconHome2'] : Icons[selectProps?.icon];
  const showNoRemainingOpt = props.getValue().length - selectProps.visibleValues.length;
  const remainingOptions = props.getValue().slice(-showNoRemainingOpt);
  const [showOverlay, setShowOverlay] = React.useState(false);
  // Checking on index as well as label in case if two labels are same
  const removeOption = (label) => {
    const _val = props.getValue().filter((opt, i) => opt.label !== label);
    selectProps.setSelected(_val);
  };
  return (
    <ValueContainer {...props}>
      <span ref={selectProps.containerRef} className="d-flex w-full align-items-center">
        {selectProps?.doShowIcon && (
          <IconElement
            style={{
              width: '16px',
              height: '16px',
              color: selectProps?.iconColor,
            }}
          />
        )}
        {!props.hasValue ? (
          <Placeholder {...props} key="placeholder" {...selectProps} data={selectProps?.visibleValues}>
            {selectProps.placeholder}
          </Placeholder>
        ) : (
          <span className="d-flex" {...props} id="options">
            {selectProps?.visibleValues.map((element, index) => (
              <div className="value-container-selected-option" key={index}>
                <span>{element.label}</span>
                <span
                  className="value-container-selected-option-delete-icon"
                  onClick={() => removeOption(element.label)}
                >
                  <RemoveCircle fill="#C1C8CD" width="20" fill2={'white'} />
                </span>
              </div>
            ))}
            <OverlayTrigger
              trigger={'click'}
              placement={'bottom-start'}
              onToggle={(showOverlay) => {
                setShowOverlay(showOverlay);
              }}
              show={showOverlay}
              rootClose={true}
              overlay={
                <Popover id="l" className={''}>
                  <Popover.Body
                    bsPrefix="list-item-popover-body"
                    className={`list-item-popover-body value-container-selected-option-popover`}
                  >
                    {remainingOptions.map((option, index) => (
                      <div className="value-container-selected-option" key={option.label}>
                        {option.label}
                        <span
                          className="value-container-selected-option-delete-icon"
                          onClick={() => {
                            removeOption(option.label);
                            setShowOverlay(false);
                          }}
                        >
                          <RemoveCircle fill="#C1C8CD" width="20" fill2={'white'} />
                        </span>
                      </div>
                    ))}
                  </Popover.Body>
                </Popover>
              }
            >
              <div>
                {showNoRemainingOpt !== 0 && (
                  <div
                    className="value-container-selected-option"
                    style={{ paddingRight: '10px' }}
                  >{`+${showNoRemainingOpt}`}</div>
                )}
              </div>
            </OverlayTrigger>
          </span>
        )}
      </span>
    </ValueContainer>
  );
};

const CustomOption = (props) => {
  return (
    <Option {...props}>
      <div className="d-flex">
        <FormCheck checked={props.isSelected} />
        <span style={{ marginLeft: '4px' }}>{props.label}</span>
      </div>
    </Option>
  );
};

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
  adjustHeightBasedOnAlignment,
}) => {
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
    multiSelectLoadingState,
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
    labelAutoWidth,
    icon,
    iconVisibility,
    errTextColor,
    iconColor,
    padding,
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
  const _height = padding === 'default' ? 32 : height;

  useEffect(() => {
    if (visibility !== properties.visibility) setVisibility(properties.visibility);
    if (isMultiSelectLoading !== multiSelectLoadingState) setIsMultiSelectLoading(multiSelectLoadingState);
    if (isMultiSelectDisabled !== disabledState) setIsMultiSelectDisabled(disabledState);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.visibility, multiSelectLoadingState, disabledState]);

  useEffect(() => {
    const updateVisibleElements = () => {
      if (!isEmpty(valueContainerRef.current)) {
        const containerWidth =
          valueContainerRef.current.offsetWidth - (iconVisibility ? ICON_WIDTH + SHOW_MORE_WIDTH : SHOW_MORE_WIDTH);
        const children = document.getElementById('options')?.children;
        if (children) {
          let totalWidth = 0;
          let maxVisibleOptions = 0;

          for (let i = 0; i < children.length; i++) {
            totalWidth += children[i].offsetWidth;

            if (totalWidth <= containerWidth) {
              maxVisibleOptions++;
            } else {
              break;
            }
          }
          setVisibleElements(selected.slice(0, maxVisibleOptions));
          setShowMore(selected.length > maxVisibleOptions);
        }
      }
    };
    updateVisibleElements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, width, selected, iconVisibility]);

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
            // if (true) {
            return { label: display_values[index], value: value, isDisabled: false };
            // }
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

  useEffect(() => {
    if (alignment == 'top' && label) adjustHeightBasedOnAlignment(true);
    else adjustHeightBasedOnAlignment(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alignment, label]);

  const customStyles = {
    control: (provided, state) => {
      return {
        ...provided,
        minHeight: _height,
        height: _height,
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
      height: _height,
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
      height: _height,
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

  if (isMultiSelectLoading) {
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
          padding: padding === 'default' ? '3px 2px' : '',
        }}
        onFocus={() => {
          onComponentClick(this, id, component);
        }}
      >
        <div
          className="my-auto"
          style={{
            alignSelf: direction === 'alignRight' ? 'flex-end' : 'flex-start',
            width: alignment === 'top' || labelAutoWidth ? 'auto' : `${labelWidth}%`,
            maxWidth: alignment === 'top' || labelAutoWidth ? '100%' : `${labelWidth}%`,
          }}
        >
          <label
            style={labelStyles}
            className="font-size-12 font-weight-500 py-0 my-0"
            data-cy={`multiselect-label-${component.name.toLowerCase()}`}
          >
            {label}
            <span style={{ color: '#DB4324', marginLeft: '1px' }}>{isMandatory && '*'}</span>
          </label>
        </div>
        <div className="col px-0 h-100" ref={multiselectRef}>
          <Select
            isDisabled={isMultiSelectDisabled}
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
            menuPortalTarget={document.body}
            placeholder={placeholder}
            components={{
              MenuList: CustomMenuList,
              ValueContainer: CustomValueContainer,
              Option: CustomOption,
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
