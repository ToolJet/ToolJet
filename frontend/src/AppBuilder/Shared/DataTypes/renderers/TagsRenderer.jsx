import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import Select from '@/_ui/Select';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { isArray } from 'lodash';
import '@/AppBuilder/Widgets/TagsInput/tagsInput.scss';
import TagsInputMenuList from '@/AppBuilder/Widgets/TagsInput/TagsInputMenuList';
import TagsInputOption from '@/AppBuilder/Widgets/TagsInput/TagsInputOption';
import defaultStyles from '@/_ui/Select/styles';
import { DropdownIndicator, CustomMultiValueContainer, MultiValueRemove, getOverlay, COLORS } from './SelectRenderer';

const sortOptions = (opts, sortTags) => {
  if (!sortTags || sortTags === 'none') return opts;
  return [...opts].sort((a, b) => {
    const cmp = (a.label || '').localeCompare(b.label || '');
    return sortTags === 'a-z' ? cmp : -cmp;
  });
};

export const MenuListWithSearch = (props) => {
  const { selectProps, optionsLoadingState, darkMode, allOptions, autoAssignColors, handleCreate } = props;
  const { inputValue, onMenuInputFocus, onInputChange, inputRef } = selectProps || {};

  return (
    <div
      className="table-select-custom-menu-list"
      style={{
        backgroundColor: 'var(--cc-surface1-surface)',
        border: '1px solid var(--cc-default-border)',
        minWidth: '200px',
      }}
    >
      <div
        className="table-select-column-type-search-box-wrapper"
        style={{ backgroundColor: 'var(--cc-surface1-surface)' }}
      >
        {!inputValue && (
          <span>
            <SolidIcon name="search" width="14" />
          </span>
        )}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.currentTarget.value, { action: 'input-change' })}
          onMouseDown={(e) => {
            e.stopPropagation();
            e.target.focus();
          }}
          onFocus={onMenuInputFocus}
          placeholder="Search..."
          className="table-select-column-type-search-box"
          autoCorrect="off"
          autoComplete="off"
          spellCheck="false"
        />
      </div>
      <div style={{ borderTop: '1px solid var(--cc-default-border)' }}>
        <TagsInputMenuList
          {...props}
          selectProps={selectProps}
          allowNewTags
          inputValue={inputValue}
          optionsLoadingState={optionsLoadingState}
          darkMode={darkMode}
          allOptions={allOptions}
          onCreateTag={handleCreate}
          autoPickChipColor={autoAssignColors}
        />
      </div>
    </div>
  );
};

/**
 * TagsRenderer — tags dropdown for the Table TagsV2 column.
 *
 * Distinct from SelectRenderer: users can create transient tag selections
 * via TagsInputMenuList, tags are optionally auto-colored, and the option
 * list can be sorted. Borrows only control + valueContainer styles from
 * SelectRenderer via _sharedStyles; all other styling is local.
 *
 * Validation is owned by the adapter; this component is pure UI.
 */
export const TagsRenderer = ({
  options,
  value,
  onChange,
  defaultOptionsList = [],
  isMulti,
  autoAssignColors = false,
  sortTags = 'none',
  placeholder,
  disabled,
  className,
  darkMode,
  textColor = '',
  horizontalAlignment = 'left',
  optionsLoadingState = false,
  isEditable,
  isNewRow,
  isFocused,
  setIsFocused,
  menuIsOpen,
  isValid = true,
  validationError,
}) => {
  const allOptions = useMemo(() => options || [], [options]);

  const optionColors = useMemo(
    () =>
      allOptions.reduce((acc, option, index) => {
        acc[option.value] =
          option.optionColor || (autoAssignColors ? COLORS[index % COLORS.length] : 'var(--surfaces-surface-03)');
        return acc;
      }, {}),
    [allOptions, autoAssignColors]
  );

  const handleCreate = useCallback(
    (newLabel) => {
      const trimmed = (newLabel || '').trim();
      if (!trimmed) return;
      const newTag = { label: trimmed, value: trimmed };

      setIsFocused(false);

      if (isMulti) {
        const currentValues = isArray(value)
          ? value.map((currentValue) => {
              const rawValue = currentValue && typeof currentValue === 'object' ? currentValue.value : currentValue;
              const matchedOption = allOptions.find((option) => option.value === rawValue);

              return matchedOption || { label: String(rawValue), value: String(rawValue) };
            })
          : [];
        const existsInSelection = currentValues.some(
          (currentValue) => String(currentValue?.value).toLowerCase() === trimmed.toLowerCase()
        );
        onChange(existsInSelection ? currentValues : [...currentValues, newTag]);
      } else {
        onChange(newTag);
      }
    },
    [allOptions, isMulti, value, onChange, setIsFocused]
  );

  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (!isMulti && !isNewRow) return;
    const handleDocumentClick = (event) => {
      const menu = event.target.closest?.('.tags-input-menu-list, .table-select-custom-menu-list');
      if (!containerRef.current?.contains(event.target) && !menu) {
        setIsFocused?.(false);
      }
    };
    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, [isMulti, isNewRow, setIsFocused]);

  const customComponents = {
    MenuList: MenuListWithSearch,
    Option: TagsInputOption,
    DropdownIndicator: isEditable ? DropdownIndicator : null,
    ...(isMulti && {
      MultiValueRemove,
      MultiValueContainer: CustomMultiValueContainer,
    }),
  };

  const customStyles = useMemo(
    () => ({
      ...defaultStyles(darkMode, '100%'),
      valueContainer: (provided) => ({
        ...provided,
        ...(isMulti && {
          marginBottom: '0',
          display: 'flex',
          flexWrap: 'no-wrap',
          overflow: 'hidden',
          flexDirection: 'row',
        }),
        justifyContent: horizontalAlignment,
      }),
      ...(isMulti && {
        multiValue: (provided) => ({
          ...provided,
          display: 'inline-block',
          marginRight: '4px',
        }),
        multiValueLabel: (provided, state) => {
          const option = state.data;
          return {
            ...provided,
            padding: '2px 6px',
            background: optionColors?.[option.value] || 'var(--surfaces-surface-03)',
            borderRadius: '6px',
            color: option?.labelColor || textColor || 'var(--text-primary)',
            fontSize: '12px',
          };
        },
      }),
      singleValue: (provided, state) => {
        const option = state.data;
        return {
          ...provided,
          padding: '2px 6px',
          background: optionColors?.[option.value] || 'var(--surfaces-surface-03)',
          borderRadius: '6px',
          color: option?.labelColor || textColor || 'var(--text-primary)',
          fontSize: '12px',
        };
      },
      menuList: (provided) => ({
        ...provided,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        backgroundColor: 'var(--surfaces-surface-01)',
        padding: '4px',
      }),
      menu: (provided) => ({
        ...provided,
        padding: '0',
        marginTop: '5px',
        borderRadius: '8px',
        boxShadow: 'var(--elevation-300-box-shadow)',
        border: '1px solid var(--border-weak)',
      }),
      option: (provided, state) => {
        // Use our controlled focus state instead of react-select's auto-focus
        const { selectProps, data } = state;
        const options = selectProps?.options || [];
        const optionIndex = options.findIndex((opt) => opt.value === data?.value);
        const isControlledFocused =
          selectProps?.focusedOptionIndex >= 0 && optionIndex === selectProps?.focusedOptionIndex;

        // Use color-mix to get 50% of hover color (effectively 4% alpha from 8%)
        const hoverBgColor = 'color-mix(in srgb, var(--interactive-overlays-fill-hover) 50%, transparent)';

        return {
          ...provided,
          backgroundColor: isControlledFocused ? hoverBgColor : 'var(--surfaces-surface-01)',
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
    }),
    [darkMode, isMulti, horizontalAlignment, textColor, optionColors]
  );

  const defaultValue = useMemo(
    () =>
      defaultOptionsList.length >= 1
        ? isMulti
          ? defaultOptionsList
          : defaultOptionsList.slice(-1)[0]
        : isMulti
        ? []
        : {},
    [isMulti, defaultOptionsList]
  );

  const selectedValue = useMemo(() => {
    if (!value) return null;
    if (isMulti && value?.length) {
      if (!isArray(value)) return [];
      const resolved = value.map((val) => {
        const v = val && typeof val === 'object' ? val.value : val;
        const match = allOptions?.find((option) => option.value === v);
        if (match) return match;
        return { label: String(v), value: String(v) };
      });
      return sortOptions(resolved.filter(Boolean), sortTags);
    }
    const v = isArray(value) ? value[0] : value;
    if (!v) return null;
    const match = allOptions?.find((option) => option.value === (v && typeof v === 'object' ? v.value : v));
    if (match) return match;
    return {
      label: String(v && typeof v === 'object' ? v.value : v),
      value: String(v && typeof v === 'object' ? v.value : v),
    };
  }, [allOptions, value, isMulti, sortTags]);

  const sortedOptions = useMemo(() => sortOptions(allOptions, sortTags), [allOptions, sortTags]);

  const handleChange = useCallback(
    (newValue) => {
      setIsFocused(false);
      if (!isMulti && newValue === selectedValue?.value) {
        onChange('');
      } else {
        onChange(newValue);
      }
    },
    [isMulti, selectedValue, onChange, setIsFocused]
  );

  const isOverflowing = useCallback(() => {
    if (!containerRef.current) return false;
    const valueContainer = containerRef.current.querySelector('.tags-renderer-select__value-container');
    return valueContainer?.clientHeight > containerRef.current?.clientHeight;
  }, []);

  return (
    <OverlayTrigger
      placement="bottom"
      overlay={
        isMulti && (selectedValue?.length || defaultValue?.length) && !isFocused ? (
          getOverlay(selectedValue || defaultValue, darkMode)
        ) : (
          <div />
        )
      }
      trigger={isMulti && !isFocused && isOverflowing() && ['hover', 'focus']}
      rootClose={true}
    >
      <>
        <div
          className="w-100 d-flex align-items-center"
          ref={containerRef}
          onClick={() => {
            if (isNewRow && isEditable) {
              setIsFocused((prev) => !prev);
            }
          }}
        >
          <Select
            options={sortedOptions}
            hasSearch={false}
            isDisabled={disabled}
            className={className}
            components={customComponents}
            value={selectedValue}
            onMenuInputFocus={() => setIsFocused(true)}
            onChange={handleChange}
            useCustomStyles={true}
            styles={customStyles}
            defaultValue={defaultValue}
            placeholder={placeholder}
            isMulti={isMulti}
            hideSelectedOptions
            isClearable={false}
            clearIndicator={false}
            darkMode={darkMode}
            menuIsOpen={menuIsOpen}
            isFocused={isFocused}
            optionColors={optionColors}
            optionsLoadingState={optionsLoadingState}
            allOptions={allOptions}
            onCreateTag={handleCreate}
            autoAssignColors={autoAssignColors}
            inputRef={searchInputRef}
          />
        </div>
        {isEditable && !isValid && (
          <div
            onClick={() => {
              if (!isValid) setIsFocused(true);
            }}
            className="invalid-feedback d-block"
          >
            {validationError}
          </div>
        )}
      </>
    </OverlayTrigger>
  );
};

export default TagsRenderer;
