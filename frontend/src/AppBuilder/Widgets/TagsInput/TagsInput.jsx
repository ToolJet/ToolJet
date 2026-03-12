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
    autoPickChipColor = true,
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
  const [focusedOptionIndex, setFocusedOptionIndex] = useState(-1); // -1 means no option focused

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

  // Color palette for auto pick chip color (matching Tags component)
  const chipColorPalette = useMemo(() => [
    { bg: '#40474D1A', text: '#40474D' }, // gray
    { bg: '#CE27611A', text: '#CE2761' }, // pink
    { bg: '#6745E21A', text: '#6745E2' }, // purple
    { bg: '#2576CE1A', text: '#2576CE' }, // blue
    { bg: '#1A9C6D1A', text: '#1A9C6D' }, // teal
    { bg: '#69AF201A', text: '#69AF20' }, // green
    { bg: '#F357171A', text: '#F35717' }, // orange
    { bg: '#EB2E391A', text: '#EB2E39' }, // red
    { bg: '#A438C01A', text: '#A438C0' }, // magenta
    { bg: '#405DE61A', text: '#405DE6' }, // indigo
    { bg: '#1E8FA31A', text: '#1E8FA3' }, // cyan
    { bg: '#34A9471A', text: '#34A947' }, // lime
    { bg: '#F191191A', text: '#F19119' }, // amber
  ], []);

  // Create a stable color map for all options
  const optionColorMap = useMemo(() => {
    const colorMap = new Map();
    allOptions.forEach((option, index) => {
      const colorIndex = index % chipColorPalette.length;
      colorMap.set(option.value, chipColorPalette[colorIndex]);
    });
    return colorMap;
  }, [allOptions, chipColorPalette]);

  // Get colors for a specific option (returns { bg, text })
  const getChipColor = (optionValue) => {
    if (!autoPickChipColor) {
      return {
        bg: tagBackgroundColor || 'var(--surfaces-surface-03)',
        text: selectedTextColor || 'var(--text-primary)',
      };
    }
    const colors = optionColorMap.get(optionValue) || chipColorPalette[0];
    return colors;
  };

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
      setFocusedOptionIndex(-1);
      return;
    }

    // Backspace on empty input - let react-select handle removing last tag
    if (e.key === 'Backspace' && !inputValue) {
      return; // react-select handles this
    }

    // Arrow keys for navigation - only open menu if search is enabled
    if (['ArrowUp', 'ArrowDown'].includes(e.key)) {
      if (!enableSearch) {
        e.preventDefault(); // Prevent menu from opening when search is disabled
        return;
      }

      // If menu is not open, open it first without navigating
      if (!isMenuOpen) {
        setIsMenuOpen(true);
        e.preventDefault();
        return;
      }

      e.preventDefault(); // Prevent react-select from handling navigation

      // Track focused option index
      if (e.key === 'ArrowDown') {
        setFocusedOptionIndex((prev) => {
          const maxIndex = filteredOptions.length - 1;
          if (maxIndex < 0) return -1; // No options
          if (prev < maxIndex) return prev + 1;
          return prev; // Stay at last option
        });
      } else if (e.key === 'ArrowUp') {
        setFocusedOptionIndex((prev) => {
          if (prev <= 0) return -1; // Go back to "no selection" state
          return prev - 1;
        });
      }
      return;
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
        setFocusedOptionIndex(-1);
        return;
      }

      // If user has navigated to an option (focusedOptionIndex >= 0), select it directly
      if (isMenuOpen && focusedOptionIndex >= 0 && focusedOptionIndex < filteredOptions.length) {
        e.preventDefault();
        const optionToSelect = filteredOptions[focusedOptionIndex];
        if (optionToSelect && !optionToSelect.isDisabled) {
          const newSelected = [...selected, optionToSelect];
          setInputValues(newSelected);
          setInputValue('');
          fireEvent('onTagAdded');
        }
        setFocusedOptionIndex(-1);
        return;
      }

      // No option focused - create new tag if allowed and there's input
      if (allowNewTags && inputValue.trim()) {
        e.preventDefault();
        handleCreate(inputValue);
        setFocusedOptionIndex(-1);
        return;
      }

      // If there's an exact match, select it
      if (matchingOption) {
        e.preventDefault();
        const newSelected = [...selected, matchingOption];
        setInputValues(newSelected);
        setInputValue('');
        fireEvent('onTagAdded');
        setFocusedOptionIndex(-1);
        return;
      }

      setFocusedOptionIndex(-1);
      return;
    }

    // Comma - select existing option or create new tag
    if ((e.key === ',' || e.key === ';') && inputValue.trim()) {
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
      Array.isArray(selectOptions) ? selectOptions.map(({ label, value }) => ({ label, value })) : []
    );
  }, [selectOptions]);

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
      setFocusedOptionIndex(-1);
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
      padding: '5px 4px',
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
    option: (provided, state) => {
      // Use our controlled focus state instead of react-select's auto-focus
      const { selectProps, data } = state;
      const options = selectProps?.options || [];
      const optionIndex = options.findIndex((opt) => opt.value === data?.value);
      const isControlledFocused = selectProps?.focusedOptionIndex >= 0 && optionIndex === selectProps?.focusedOptionIndex;

      // Use color-mix to get 50% of hover color (effectively 4% alpha from 8%)
      const hoverBgColor = 'color-mix(in srgb, var(--interactive-overlays-fill-hover) 50%, transparent)';

      return {
        ...provided,
        backgroundColor: isControlledFocused
          ? hoverBgColor
          : 'var(--surfaces-surface-01)',
        color: 'var(--text-primary)',
        opacity: state.isDisabled ? 0.3 : 1,
        cursor: 'pointer',
        padding: '8px 12px',
        borderRadius: '6px',
        '&:active': {
          backgroundColor: 'var(--interactive-overlays-fill-pressed)',
        },
        '&:hover': {
          backgroundColor: hoverBgColor,
        },
      };
    },
    menuList: (provided) => ({
      ...provided,
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
      backgroundColor: 'var(--surfaces-surface-01)',
      padding:"4px",
    }),
    menu: (provided) => ({
      ...provided,
      padding: '0',
      marginTop: '5px',
      borderRadius: '8px',
      boxShadow: 'var(--elevation-300-box-shadow)',
      border: '1px solid var(--border-weak)',
    }),
  };

  const _width = getLabelWidthOfInput(widthType, labelWidth);

  // Filter options to exclude already selected and match input text
  const filteredOptions = useMemo(() => {
    return allOptions
      .filter((opt) => !selected.some((s) => s.value === opt.value))
      .filter((opt) => !inputValue || opt.label?.includes(inputValue));
  }, [allOptions, selected, inputValue]);

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
              : 'align-items-start']: true,
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
            top={alignment === 'side' ? '8px' : undefined}
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
                  // Reset focused option when user types - they're now searching, not navigating
                  setFocusedOptionIndex(-1);
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
                    onCreateTag={handleCreate}
                    autoPickChipColor={autoPickChipColor}
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
              focusedOptionIndex={focusedOptionIndex}
              autoPickChipColor={autoPickChipColor}
              getChipColor={getChipColor}
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
