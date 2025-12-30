import React, { useState, useEffect, useMemo, useRef } from 'react';
import CreatableSelect from 'react-select/creatable';
import './tagsInput.scss';
import cx from 'classnames';
import Label from '@/_ui/Label';
import Loader from '@/ToolJetUI/Loader/Loader';
import { ToolTip } from '@/_components/ToolTip';
import { useEditorStore } from '@/_stores/editorStore';
import { getInputBackgroundColor, getInputBorderColor, getInputFocusedColor, sortArray } from '../DropdownV2/utils';
import { getModifiedColor, getSafeRenderableValue } from '@/AppBuilder/Widgets/utils';
import {
  getLabelWidthOfInput,
  getWidthTypeOfComponentStyles,
} from '@/AppBuilder/Widgets/BaseComponents/hooks/useInput';
import TagsInputChip from './TagsInputChip';
import TagsInputValueContainer from './TagsInputValueContainer';
import TagsInputMenuList from './TagsInputMenuList';
import TagsInputOption from './TagsInputOption';
import { useHeightObserver } from '@/_hooks/useHeightObserver';
import { useDynamicHeight } from '@/_hooks/useDynamicHeight';

export const TagsInput = ({
  id,
  height,
  width,
  properties,
  styles,
  setExposedVariable,
  setExposedVariables,
  onComponentClick,
  darkMode,
  fireEvent,
  validate,
  validation,
  componentName,
  adjustComponentPositions,
  currentLayout,
  currentMode,
  subContainerIndex,
}) => {
  const {
    label,
    placeholder,
    advanced,
    schema,
    allowNewTags,
    loadingState: tagsLoadingState,
    optionsLoadingState,
    dynamicHeight,
    sort,
    tooltip,
    enableSearch = true,
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
    errTextColor,
    padding,
    accentColor,
    widthType,
    tagBackgroundColor,
  } = styles;

  const isInitialRender = useRef(true);
  const [selected, setSelected] = useState([]);
  const [newTagsAdded, setNewTagsAdded] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const options = properties?.options;
  const isMandatory = validation?.mandatory ?? false;
  const tagsRef = useRef(null);
  const labelRef = useRef(null);
  const selectRef = useRef(null);
  const [validationStatus, setValidationStatus] = useState(
    validate(selected?.length ? selected?.map((option) => option.value) : null)
  );
  const { isValid, validationError } = validationStatus;
  const [visibility, setVisibility] = useState(properties.visibility);
  const [isTagsLoading, setIsTagsLoading] = useState(tagsLoadingState);
  const [isTagsDisabled, setIsTagsDisabled] = useState(properties.disabledState);
  const _height = padding === 'default' ? `${height}px` : `${height + 4}px`;
  const [userInteracted, setUserInteracted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Dynamic height support - only enabled in view mode (same as TextArea)
  const isDynamicHeightEnabled = dynamicHeight && currentMode === 'view';
  const heightChangeValue = useHeightObserver(tagsRef, isDynamicHeightEnabled);

  useDynamicHeight({
    isDynamicHeightEnabled,
    id,
    height,
    value: heightChangeValue,
    adjustComponentPositions,
    currentLayout,
    width,
    visibility,
    subContainerIndex,
  });

  useEffect(() => {
    if (visibility !== properties.visibility) setVisibility(properties.visibility);
    if (isTagsLoading !== tagsLoadingState) setIsTagsLoading(tagsLoadingState);
    if (isTagsDisabled !== properties.disabledState) setIsTagsDisabled(properties.disabledState);
  }, [properties.visibility, tagsLoadingState, properties.disabledState]);

  // Build select options from schema or options
  const selectOptions = useMemo(() => {
    const _options = advanced ? schema : options;
    let _selectOptions = Array.isArray(_options)
      ? _options
          .filter((data) => data?.visible ?? true)
          .map((data) => ({
            ...data,
            label: getSafeRenderableValue(data?.label),
            value: data?.value,
            isDisabled: data?.disable ?? false,
          }))
      : [];
    return sortArray(_selectOptions, sort);
  }, [advanced, JSON.stringify(schema), JSON.stringify(options), sort]);

  // Combine predefined options with session-created tags
  const allOptions = useMemo(() => {
    return [...selectOptions, ...newTagsAdded];
  }, [selectOptions, newTagsAdded]);

  // Check for duplicate labels (case-sensitive)
  const isDuplicate = (label) => {
    return allOptions.some((opt) => opt.label === label);
  };

  // Find default items based on options
  function findDefaultItem(values, isAdvanced=false, isDefault=false) {
    if (isAdvanced) {
      const foundItem = Array.isArray(schema) ? schema.filter((item) => item?.visible && item?.default) : [];
      return foundItem;
    }
    if (isDefault) {
      return Array.isArray(allOptions)
        ? allOptions.filter((item) => item?.default || values?.find((val) => val === item.value))
        : [];
    } else {
      return Array.isArray(allOptions)
        ? allOptions.filter((item) => selected?.find((val) => val.value === item.value))
        : [];
    }
  }

  // Set input value and update exposed variables
  const setInputValues = (values) => {
    setSelected(values);
    setExposedVariables({
      values: values.map((item) => item.value),
      selectedTags: Array.isArray(values) ? values.map(({ label, value }) => ({ label, value })) : [],
    });
    const validationStatus = validate(values?.length ? values?.map((option) => option.value) : null);
    setValidationStatus(validationStatus);
    setExposedVariable('isValid', validationStatus?.isValid);
  };

  // Handle tag creation
  const handleCreate = (newValue) => {
    const trimmedValue = newValue.trim();
    if (!trimmedValue) return;

    if (isDuplicate(trimmedValue)) {
      // If duplicate exists, just select it if not already selected
      const existingOption = allOptions.find((opt) => opt.label === trimmedValue);
      if (existingOption && !selected.some((s) => s.value === existingOption.value)) {
        const newSelected = [...selected, existingOption];
        setInputValues(newSelected);
        fireEvent('onTagAdded');
      }
      setInputValue('');
      return;
    }

    const newTag = { label: trimmedValue, value: trimmedValue };
    const updatedNewTags = [...newTagsAdded, newTag];
    setNewTagsAdded(updatedNewTags);
    setExposedVariable('newTagsAdded', updatedNewTags.map(({ label, value }) => ({ label, value })));

    const newSelected = [...selected, newTag];
    setInputValues(newSelected);
    setInputValue('');
    fireEvent('onTagAdded');
    setUserInteracted(true);
  };

  // Handle change (selection/deselection)
  const onChangeHandler = (items, action) => {
    if (action.action === 'remove-value' || action.action === 'pop-value') {
      fireEvent('onTagDeleted');
    } else if (action.action === 'select-option') {
      fireEvent('onTagAdded');
    }
    setInputValues(items || []);
    setUserInteracted(true);
  };

  // Handle keyboard events
  const handleKeyDown = (e) => {
    // Escape closes the menu
    if (e.key === 'Escape') {
      setIsMenuOpen(false);
      setInputValue('');
      return;
    }

    // Backspace on empty input - let react-select handle removing last tag
    if (e.key === 'Backspace' && !inputValue) {
      return; // react-select handles this
    }

    // Arrow keys for navigation - only open menu if search is enabled
    if (['ArrowUp', 'ArrowDown'].includes(e.key)) {
      if (enableSearch && !isMenuOpen) {
        setIsMenuOpen(true);
      }
      if (!enableSearch) {
        e.preventDefault(); // Prevent menu from opening when search is disabled
        return;
      }
      return; // react-select handles navigation
    }

    // Enter key - select highlighted option OR create new tag
    if (e.key === 'Enter') {
      const trimmedInput = inputValue.trim();
      const matchingOption = filteredOptions.find((opt) => opt.label === trimmedInput);

      // When search is disabled, handle selection directly
      if (!enableSearch && inputValue.trim()) {
        e.preventDefault();
        if (matchingOption) {
          // Select the matching existing option
          const newSelected = [...selected, matchingOption];
          setInputValues(newSelected);
          setInputValue('');
          fireEvent('onTagAdded');
        } else if (allowNewTags) {
          // Create new tag if allowed
          handleCreate(inputValue);
        }
        return;
      }

      // When search is enabled, create new tag if no match and allowNewTags
      if (allowNewTags && inputValue.trim() && !matchingOption) {
        e.preventDefault();
        handleCreate(inputValue);
        return;
      }
      // Otherwise let react-select handle the selection
      return;
    }

    // Comma - select existing option or create new tag
    if (e.key === ',' && inputValue.trim()) {
      e.preventDefault();
      const trimmedInput = inputValue.trim();
      const matchingOption = filteredOptions.find((opt) => opt.label === trimmedInput);
      if (matchingOption) {
        const newSelected = [...selected, matchingOption];
        setInputValues(newSelected);
        setInputValue('');
        fireEvent('onTagAdded');
      } else if (allowNewTags) {
        handleCreate(inputValue);
      }
      return;
    }

    // Tab - select existing option or create new tag, otherwise let it move focus
    if (e.key === 'Tab' && inputValue.trim()) {
      const trimmedInput = inputValue.trim();
      const matchingOption = filteredOptions.find((opt) => opt.label === trimmedInput);
      if (matchingOption) {
        e.preventDefault();
        const newSelected = [...selected, matchingOption];
        setInputValues(newSelected);
        setInputValue('');
        fireEvent('onTagAdded');
      } else if (allowNewTags) {
        e.preventDefault();
        handleCreate(inputValue);
      }
      return;
    }
  };

  // Restore selection when options change (static mode only)
  useEffect(() => {
    if (!advanced) {
      let foundItem = findDefaultItem(properties?.values, advanced);
      setInputValues(foundItem);
    }
  }, [selectOptions]);

  // Apply defaults when mode, values, or schema changes
  useEffect(() => {
    let foundItem = findDefaultItem(properties?.values, advanced, true);
    setInputValues(foundItem);
  }, [advanced, JSON.stringify(properties?.values), JSON.stringify(schema)]);

  // Exposed variable updates
  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable(
      'tags',
      Array.isArray(allOptions) && allOptions?.map(({ label, value }) => ({ label, value }))
    );
  }, [allOptions]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('label', label);
  }, [label]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isVisible', properties.visibility);
  }, [properties.visibility]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isLoading', tagsLoadingState);
  }, [tagsLoadingState]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isDisabled', properties.disabledState);
  }, [properties.disabledState]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isMandatory', isMandatory);
  }, [isMandatory]);

  useEffect(() => {
    if (isInitialRender.current) return;
    const validationStatus = validate(selected?.length ? selected?.map((option) => option.value) : null);
    setValidationStatus(validationStatus);
    setExposedVariable('isValid', validationStatus?.isValid);
  }, [validate]);

  // Initialize exposed variables and actions
  useEffect(() => {
    const defaultItems = findDefaultItem(properties?.values, advanced, true);

    const exposedVariables = {
      clear: async function () {
        setInputValues([]);
      },
      setVisibility: async function (value) {
        setVisibility(!!value);
        setExposedVariable('isVisible', !!value);
      },
      setLoading: async function (value) {
        setIsTagsLoading(!!value);
        setExposedVariable('isLoading', !!value);
      },
      setDisable: async function (value) {
        setIsTagsDisabled(!!value);
        setExposedVariable('isDisabled', !!value);
      },
      label: label,
      isVisible: properties.visibility,
      isLoading: tagsLoadingState,
      isDisabled: properties.disabledState,
      isMandatory: isMandatory,
      isValid: isValid,
      selectedTags: Array.isArray(defaultItems) ? defaultItems.map(({ label, value }) => ({ label, value })) : [],
      tags: Array.isArray(selectOptions) ? selectOptions.map(({ label, value }) => ({ label, value })) : [],
      newTagsAdded: [],
    };
    setExposedVariables(exposedVariables);
    isInitialRender.current = false;
  }, []);

  // Update selectTags/deselectTags when options change
  useEffect(() => {
    setExposedVariable('selectTags', async function (tags) {
      if (Array.isArray(tags)) {
        const newSelected = [...selected];
        tags.forEach((tag) => {
          // Support both value and label extraction from object
          const tagValue = typeof tag === 'object' && tag?.value ? tag.value : tag;
          const tagLabel = typeof tag === 'object' && tag?.label ? tag.label : tag;

          // Find matching option by value first, then by label as fallback
          const matchingOption = allOptions.find(
            (option) => option.value === tagValue || option.label === tagLabel
          );

          if (matchingOption && !selected.some((s) => s.value === matchingOption.value)) {
            newSelected.push(matchingOption);
          }
        });
        setInputValues(newSelected);
      }
    });

    setExposedVariable('deselectTags', async function (tags) {
      if (Array.isArray(tags)) {
        const tagIdentifiers = tags.map((tag) => ({
          value: typeof tag === 'object' && tag?.value ? tag.value : tag,
          label: typeof tag === 'object' && tag?.label ? tag.label : tag,
        }));
        // Filter out options that match by value OR label
        const newSelected = selected.filter(
          (option) =>
            !tagIdentifiers.some(
              (identifier) => option.value === identifier.value || option.label === identifier.label
            )
        );
        setInputValues(newSelected);
      }
    });
  }, [allOptions, selected]);

  // Handle click outside
  const handleClickOutside = (event) => {
    let menu = document.getElementById(`tags-input-menu-${id}`);
    if (
      isMenuOpen &&
      tagsRef.current &&
      !tagsRef.current.contains(event.target) &&
      menu &&
      !menu.contains(event.target)
    ) {
      setIsMenuOpen(false);
      fireEvent('onBlur');
      setInputValue('');
    }
  };

  const handleClickInside = () => {
    if (isTagsDisabled || isTagsLoading) return;

    // Focus the input when clicking anywhere in the component
    if (selectRef.current) {
      selectRef.current.focus();
    }

    // Only open menu when enableSearch is true
    if (enableSearch && !isMenuOpen) {
      setIsMenuOpen(true);
      fireEvent('onFocus');
    } else if (!enableSearch && !isMenuOpen) {
      // Still fire focus event even when search is disabled
      fireEvent('onFocus');
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside, { capture: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, { capture: true });
    };
  }, [isMenuOpen, componentName]);

  const customStyles = {
    container: (base) => ({
      ...base,
      width: '100%',
      minWidth: '72px',
    }),
    control: (provided, state) => ({
      ...provided,
      minHeight: _height,
      height: isDynamicHeightEnabled ? 'auto' : _height,
      boxShadow:
        state.isFocused || isMenuOpen ? `0 0 0 1px ${getInputFocusedColor({ accentColor })}` : boxShadow,
      borderRadius: Number.parseFloat(fieldBorderRadius),
      alignItems: 'flex-start',
      overflowY: isDynamicHeightEnabled ? 'visible' : 'auto',
      overflowX: 'hidden',
      borderColor: getInputBorderColor({
        isFocused: state.isFocused || isMenuOpen,
        isValid,
        fieldBorderColor,
        accentColor,
        isLoading: isTagsLoading,
        isDisabled: isTagsDisabled,
        userInteracted,
      }),
      backgroundColor: getInputBackgroundColor({
        fieldBackgroundColor,
        darkMode,
        isLoading: isTagsLoading,
        isDisabled: isTagsDisabled,
      }),
      '&:hover': {
        borderColor:
          state.isFocused || isMenuOpen
            ? getInputFocusedColor({ accentColor })
            : getModifiedColor(fieldBorderColor, 24),
      },
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: '4px 10px',
      display: 'flex',
      flexWrap: isDynamicHeightEnabled ? 'wrap' : 'nowrap',
      gap: '4px',
      alignItems: selected.length > 0 ? 'flex-start' : 'center',
      maxWidth: '100%',
      overflow: 'visible',
      flex: 1,
      height: isDynamicHeightEnabled ? 'auto' : '100%',
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: tagBackgroundColor || 'var(--surfaces-surface-03)',
      borderRadius: '2px',
      margin: '0',
      maxWidth: '100%', // Ensure tag doesn't exceed container width
      minWidth: 0, // Allow shrinking for ellipsis
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: selectedTextColor,
      fontSize: '14px',
      lineHeight: '20px',
      fontWeight: 400,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    }),
    input: (provided) => ({
      ...provided,
      color: 'var(--text-placeholder)',
      margin: '0px',
      padding: '0',
    }),
    indicatorSeparator: () => ({
      display: 'none',
    }),
    indicatorsContainer: (provided) => ({
      ...provided,
      display: 'flex',
      alignItems: 'center',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: 'var(--text-placeholder)',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused
        ? 'var(--interactive-overlays-fill-hover)'
        : 'var(--surfaces-surface-01)',
      color: 'var(--text-primary)',
      opacity: state.isDisabled ? 0.3 : 1,
      cursor: 'pointer',
      padding: '8px 12px',
      '&:active': {
        backgroundColor: 'var(--interactive-overlays-fill-pressed)',
      },
      '&:hover': {
        backgroundColor: 'var(--interactive-overlays-fill-hover)',
      },
    }),
    menuList: (provided) => ({
      ...provided,
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
      backgroundColor: 'var(--surfaces-surface-01)',
      padding:"0",
    }),
    menu: (provided) => ({
      ...provided,
      padding: '0',
      marginTop: '5px',
      borderRadius: '9px',
      boxShadow: 'var(--elevation-300-box-shadow)',
      border: '1px solid var(--border-weak)',
    }),
  };

  const _width = getLabelWidthOfInput(widthType, labelWidth);

  // Filter options to exclude already selected
  const filteredOptions = useMemo(() => {
    return allOptions.filter((opt) => !selected.some((s) => s.value === opt.value));
  }, [allOptions, selected]);

  return (
    <>
      <ToolTip message={tooltip} show={!!tooltip}>
        <div
          ref={tagsRef}
          data-cy={`label-${String(componentName).toLowerCase()}`}
          className={cx('tags-input-widget', 'd-flex', {
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
          onMouseDown={() => {
            onComponentClick(id);
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
            widthType={widthType}
            id={`${id}-label`}
          />
          <div
            className={cx('px-0', { 'h-100': !isDynamicHeightEnabled })}
            onClick={handleClickInside}
            onTouchEnd={handleClickInside}
            style={{
              ...getWidthTypeOfComponentStyles(widthType, labelWidth, auto, alignment),
              ...(auto && {
                flex: 1,
                minWidth: 0,
              }),
            }}
          >
            <CreatableSelect
              ref={selectRef}
              menuId={id}
              isDisabled={isTagsDisabled}
              value={selected}
              onChange={onChangeHandler}
              onCreateOption={handleCreate}
              options={filteredOptions}
              styles={customStyles}
              aria-hidden={!visibility}
              aria-disabled={isTagsDisabled}
              aria-busy={isTagsLoading}
              aria-required={isMandatory}
              aria-invalid={!isValid}
              id={`component-${id}`}
              aria-labelledby={`${id}-label`}
              aria-label={!auto && labelWidth == 0 && label?.length != 0 ? label : undefined}
              isLoading={isTagsLoading}
              inputValue={inputValue}
              onInputChange={(value, action) => {
                if (action.action === 'input-change') {
                  setInputValue(value);
                }
              }}
              menuIsOpen={enableSearch && isMenuOpen}
              placeholder={placeholder}
              formatCreateLabel={(input) => `add "${input}"`}
              isValidNewOption={(input) => {
                if (!allowNewTags || !input.trim()) return false;
                // Don't show create option if label already exists (case-sensitive)
                const trimmedInput = input.trim();
                const labelExists = allOptions.some((opt) => opt.label === trimmedInput);
                return !labelExists;
              }}
              components={{
                MultiValue: TagsInputChip,
                ValueContainer: TagsInputValueContainer,
                MenuList: (props) => (
                  <TagsInputMenuList
                    {...props}
                    allowNewTags={allowNewTags}
                    inputValue={inputValue}
                    optionsLoadingState={optionsLoadingState && advanced}
                    darkMode={darkMode}
                    tagBackgroundColor={tagBackgroundColor}
                    selectedTextColor={selectedTextColor}
                    allOptions={allOptions}
                  />
                ),
                Option: TagsInputOption,
                LoadingIndicator: () => <Loader style={{ right: '11px', zIndex: 3, position: 'absolute' }} width="16" />,
                DropdownIndicator: () => null,
              }}
              isClearable={false}
              isMulti
              hideSelectedOptions={true}
              filterOption={(option, inputValue) => option.label?.includes(inputValue)}
              closeMenuOnSelect={false}
              tabSelectsValue={false}
              onKeyDown={handleKeyDown}
              menuPlacement="auto"
              menuPortalTarget={document.body}
              minMenuHeight={300}
              // Custom props
              allowNewTags={allowNewTags}
              tagBackgroundColor={tagBackgroundColor}
              selectedTextColor={selectedTextColor}
            />
          </div>
        </div>
      </ToolTip>
      {userInteracted && visibility && !isValid && (
        <div
          className="d-flex"
          style={{
            color: errTextColor,
            justifyContent: direction === 'right' ? 'flex-start' : 'flex-end',
            fontSize: '11px',
            fontWeight: '400',
            lineHeight: '16px',
          }}
        >
          {validationError}
        </div>
      )}
    </>
);
};
