import _ from 'lodash';
import React, { useState, useEffect } from 'react';
import { FormCheck } from 'react-bootstrap';
import { MultiSelect } from 'react-multi-select-component';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import TriangleDownArrow from '@/_ui/Icon/bulkIcons/TriangleDownArrow';
import TriangleUpArrow from '@/_ui/Icon/bulkIcons/TriangleUpArrow';

const ItemRenderer = ({ checked, option, onClick, disabled }) => (
  <div className={`item-renderer ${disabled && 'disabled'}`}>
    <FormCheck checked={checked} disabled={disabled} tabIndex={-1} onClick={onClick} />
    <span>{option.label}</span>
  </div>
);
const DropdownIndicator = ({ isOpen, toggleDropdown }) => {
  return (
    <div onClick={toggleDropdown}>
      {isOpen ? (
        <TriangleUpArrow width={'18'} className="cursor-pointer" fill={'var(--borders-strong)'} />
      ) : (
        <TriangleDownArrow width={'18'} className="cursor-pointer" fill={'var(--borders-strong)'} />
      )}
    </div>
  );
};

export const Multiselect = function Multiselect({
  id,
  height,
  properties,
  styles,
  setExposedVariable,
  setExposedVariables,
  onComponentClick,
  darkMode,
  fireEvent,
  componentName,
  dataCy,
  formId,
}) {
  const { label, value, values, display_values, showAllOption } = properties;
  const { borderRadius, visibility, disabledState, boxShadow } = styles;
  const [selected, setSelected] = useState([]);
  const [searched, setSearched] = useState('');

  let selectOptions = [];
  try {
    selectOptions = [
      ...values.map((value, index) => {
        return { label: display_values[index], value: value };
      }),
    ];
  } catch (err) {
    console.log(err);
  }

  // useEffect(() => {
  //   let newValues = [];

  //   if (_.intersection(values, value)?.length === value?.length) newValues = value;

  //   setExposedVariable('values', newValues);
  //   setSelected(selectOptions.filter((option) => newValues.includes(option.value)));
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [JSON.stringify(values), JSON.stringify(display_values)]);

  useEffect(() => {
    setExposedVariable('values', value);
    setSelected(selectOptions.filter((option) => value.includes(option.value)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(value), JSON.stringify(display_values)]);

  useEffect(() => {
    if (value) {
      setSelected(selectOptions.filter((option) => properties.value.includes(option.value)));
    }
  }, []);

  const onChangeHandler = (items) => {
    setSelected(items);
    setExposedVariable(
      'values',
      items.map((item) => item.value)
    );
    fireEvent('onSelect');
  };

  useEffect(() => {
    const exposedVariables = {
      selectOption: async function (value) {
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
          setExposedVariable(
            'values',
            newSelected.map((item) => item.value)
          );
          fireEvent('onSelect');
        }
      },
      deselectOption: async function (value) {
        if (
          selectOptions.some((option) => option.value === value) &&
          selected.some((option) => option.value === value)
        ) {
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
      },
      clearSelections: async function () {
        if (selected.length >= 1) {
          setSelected([]);
          setExposedVariable('values', []);
          fireEvent('onSelect');
        }
      },
    };

    setExposedVariables(exposedVariables);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, setSelected]);

  const filterOptions = (options, filter) => {
    setSearched(filter);

    if (searched !== filter) {
      setExposedVariable('searchText', filter);
      fireEvent('onSearchTextChanged');
    }
    if (!filter) return options;

    return options.filter(
      ({ label, value }) => label != null && value != null && label.toLowerCase().includes(filter.toLowerCase())
    );
  };
  return (
    <div
      className="multiselect-widget row g-0"
      data-cy={dataCy}
      style={{ height, display: visibility ? '' : 'none' }}
      onClick={(event) => {
        event.stopPropagation();
        onComponentClick(id);
      }}
    >
      <div className="col-auto my-auto d-flex align-items-center">
        <label
          style={{ marginRight: label ? '1rem' : '', marginBottom: 0 }}
          className={`form-label py-1 ${darkMode ? 'text-light' : 'text-secondary'}`}
          data-cy={`multiselect-label-${componentName?.toLowerCase()}`}
        >
          {label}
        </label>
      </div>
      <div className="col px-0 h-100" style={{ borderRadius: parseInt(borderRadius), boxShadow }}>
        <MultiSelect
          hasSelectAll={showAllOption ?? false}
          options={selectOptions}
          value={selected}
          onChange={onChangeHandler}
          labelledBy={'Select'}
          disabled={disabledState}
          className={`multiselect-box${darkMode ? ' dark dark-multiselectinput' : ''}`}
          ItemRenderer={ItemRenderer}
          filterOptions={filterOptions}
          debounceDuration={0}
          // isOpen={isOpen}
          // onMenuOpen={handleDropdownOpen}
          // onMenuClose={handleDropdownClose}
          // ArrowRenderer={() => <DropdownIndicator isOpen={isOpen} toggleDropdown={toggleDropdown} />}
          onMenuToggle={(isOpen) => {
            if (isOpen) {
              // get all instances to handle for listview
              const elements = document.querySelectorAll(`[id='${id}']`) || [];
              elements.forEach((element) => {
                // check if dropdown is open and set z-index
                const child = element.querySelector(`.dropdown-container`);
                if (child && child.hasAttribute('aria-expanded') && child.getAttribute('aria-expanded') === 'true') {
                  const listViewParent = child?.closest('.list-item');
                  if (listViewParent) listViewParent.style.zIndex = 1;
                  element.style.zIndex = 3;
                }
              });
            } else {
              const elements = document.querySelectorAll(`[id='${id}']`) || [];
              elements.forEach((element) => {
                // check if dropdown is open and unset z-index
                const child = element.querySelector(`.dropdown-container`);
                if (child && child.hasAttribute('aria-expanded') && child.getAttribute('aria-expanded') === 'false') {
                  const listViewParent = child?.closest('.list-item');
                  if (listViewParent) listViewParent.style.zIndex = '';
                  element.style.zIndex = '';
                }
              });
            }

            const formComponent = formId && document.querySelector(`.form-${formId}`);
            if (formComponent) {
              formComponent.style.zIndex = isOpen ? 4 : '';
            }
          }}
        />
      </div>
    </div>
  );
};
