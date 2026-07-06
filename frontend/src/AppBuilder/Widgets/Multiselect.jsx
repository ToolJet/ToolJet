import _ from 'lodash';
import React, { useEffect, useMemo, useRef } from 'react';
import { FormCheck } from 'react-bootstrap';
import { MultiSelect } from 'react-multi-select-component';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import TriangleDownArrow from '@/_ui/Icon/bulkIcons/TriangleDownArrow';
import TriangleUpArrow from '@/_ui/Icon/bulkIcons/TriangleUpArrow';
import './multiselect.scss';
import { useComponentCommands } from '@/AppBuilder/_hooks/useComponentCommands';
import { useExposedVariable } from '@/AppBuilder/_hooks/useExposedVariable';
import '@/AppBuilder/_engine/contractGroups/wave4';

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
  componentType,
  moduleId,
  resolveIndex,
}) {
  const { label, value, values, display_values, showAllOption } = properties;
  const { borderRadius, visibility, disabledState, boxShadow } = styles;
  const searchedRef = useRef('');

  const exposedOpts = { resolveIndex, moduleId };
  const { dispatch } = useComponentCommands({
    id,
    componentType,
    moduleId,
    resolveIndex,
    setExposedVariables,
    fireEvent,
  });

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

  // Store is the source of truth for the exposed `values`; the resolved
  // `value` property is the pre-first-publish fallback.
  const exposedValues = useExposedVariable(id, 'values', exposedOpts, undefined) ?? value;
  // Render-only derivation — replaces the old `selected` useState mirror.
  const selected = useMemo(
    () => selectOptions.filter((option) => (exposedValues || []).includes(option.value)),
    [selectOptions, exposedValues]
  );

  // Latest-ref: the selectOption/deselectOption/clearSelections CSAs
  // (registered once at mount) must never close over stale selectOptions/
  // exposedValues from the mount-time render.
  const ctxRef = useRef({ selectOptions, exposedValues });
  ctxRef.current = { selectOptions, exposedValues };

  // Not isInitialRender-gated — matches old (unconditional passthrough of
  // the resolved `value` prop into exposed `values`, including at mount).
  useEffect(() => {
    setExposedVariable('values', value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(value), JSON.stringify(display_values)]);

  const onChangeHandler = (items) => {
    setExposedVariable(
      'values',
      items.map((item) => item.value)
    );
    fireEvent('onSelect');
  };

  // CSA path (RunJS / other components) — old guards preserved exactly:
  // selectOption/deselectOption require selectOptions membership PLUS the
  // opposite current-selection state; clearSelections requires a non-empty
  // selection. All three fire onSelect only when the guard passes.
  const selectOption = async (targetValue) => {
    const { selectOptions, exposedValues } = ctxRef.current;
    if (selectOptions.some((option) => option.value === targetValue) && !(exposedValues || []).includes(targetValue)) {
      dispatch([
        { kind: 'INVOKE_CSA', componentId: id, action: 'selectOption', args: [targetValue] },
        { kind: 'FIRE_EVENT', componentId: id, event: 'onSelect' },
      ]);
    }
  };

  const deselectOption = async (targetValue) => {
    const { selectOptions, exposedValues } = ctxRef.current;
    if (selectOptions.some((option) => option.value === targetValue) && (exposedValues || []).includes(targetValue)) {
      dispatch([
        { kind: 'INVOKE_CSA', componentId: id, action: 'deselectOption', args: [targetValue] },
        { kind: 'FIRE_EVENT', componentId: id, event: 'onSelect' },
      ]);
    }
  };

  const clearSelections = async () => {
    const { exposedValues } = ctxRef.current;
    if ((exposedValues || []).length >= 1) {
      dispatch([
        { kind: 'INVOKE_CSA', componentId: id, action: 'clearSelections', args: [] },
        { kind: 'FIRE_EVENT', componentId: id, event: 'onSelect' },
      ]);
    }
  };

  useEffect(() => {
    setExposedVariables({ selectOption, deselectOption, clearSelections });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const dropdownContainer = document.querySelector(`[aria-labelledby='${id}-label']`);
    if (dropdownContainer) {
      dropdownContainer.removeAttribute('aria-readonly');
    }
  }, []);

  const filterOptions = (options, filter) => {
    if (searchedRef.current !== filter) {
      searchedRef.current = filter;
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
          style={{ marginRight: label ? '1rem' : '', marginBottom: 0, color: 'var(--cc-primary-text)' }}
          className={`form-label py-1`}
          data-cy={`multiselect-label-${componentName?.toLowerCase()}`}
          id={`${id}-label`}
        >
          {label}
        </label>
      </div>
      <div
        className="col px-0 h-100"
        style={{
          borderRadius: parseInt(borderRadius),
          boxShadow,
          backgroundColor: 'var(--cc-surface1-surface)',
          color: 'var(--cc-primary-text)',
        }}
        id={`component-${id}`}
        aria-hidden={!visibility}
        aria-disabled={disabledState}
      >
        <MultiSelect
          hasSelectAll={showAllOption ?? false}
          options={selectOptions}
          value={selected}
          onChange={onChangeHandler}
          labelledBy={`${id}-label`}
          disabled={disabledState}
          className={`multiselect-box${darkMode ? ' dark dark-multiselectinput' : ''}`}
          ItemRenderer={ItemRenderer}
          filterOptions={filterOptions}
          debounceDuration={0}
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
