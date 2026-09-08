import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import Select from '@/_ui/Select';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { IconX } from '@tabler/icons-react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { isArray } from 'lodash';
import '@/AppBuilder/Widgets/TagsInput/tagsInput.scss';
import TagsInputMenuList from '@/AppBuilder/Widgets/TagsInput/TagsInputMenuList';
import TagsInputOption from '@/AppBuilder/Widgets/TagsInput/TagsInputOption';
import defaultStyles from '@/_ui/Select/styles';
import { DropdownIndicator, getOverlay, COLORS } from './SelectRenderer';

const DEFAULT_TAG_BACKGROUND_COLOR = 'var(--surfaces-surface-03)';

const getAutoAssignedChipColor = (value) => {
  const stringValue = String(value ?? '');
  const colorIndex = Array.from(stringValue).reduce((sum, char) => sum + char.charCodeAt(0), 0) % COLORS.length;

  return COLORS[colorIndex];
};

const sortOptions = (opts, sortTags) => {
  if (!sortTags || sortTags === 'none') return opts;
  return [...opts].sort((a, b) => {
    const cmp = (a.label || '').localeCompare(b.label || '');
    return sortTags === 'a-z' ? cmp : -cmp;
  });
};

const getTagChipStyles = (data, selectProps) => {
  const background =
    selectProps?.optionColors?.[data?.value] ||
    (selectProps?.autoPickChipColor ? getAutoAssignedChipColor(data?.value) : DEFAULT_TAG_BACKGROUND_COLOR);

  return {
    display: 'inline-flex',
    alignItems: 'center',
    background,
    borderRadius: '6px',
    color: data?.labelColor || selectProps?.selectedTextColor || 'var(--text-primary)',
    fontSize: '12px',
  };
};

const TagsMultiValueRemove = ({ innerProps, selectProps }) => {
  if (!selectProps?.isEditable) return null;

  return (
    <div
      {...innerProps}
      style={{
        display: 'flex',
        alignItems: 'center',
        paddingRight: '4px',
      }}
    >
      <IconX size={16} stroke={2} fill="#000" opacity={0.2} />
    </div>
  );
};

const TagsMultiValueContainer = ({ children, data, selectProps }) => (
  <div style={getTagChipStyles(data, selectProps)}>{children}</div>
);

const TagsSingleValue = ({ children, data, selectProps }) => (
  <div style={getTagChipStyles(data, selectProps)}>
    <div
      style={{
        padding: '4px 7px',
        color: 'inherit',
        fontSize: 'inherit',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {children}
    </div>
    {selectProps?.isEditable && (
      <div
        onMouseDown={(event) => {
          console.log('onMouseDown', event);
          event.preventDefault();
          event.stopPropagation();
          selectProps?.onChange?.('');
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          paddingRight: '4px',
          cursor: 'pointer',
        }}
      >
        <IconX size={16} stroke={2} fill="#000" opacity={0.2} />
      </div>
    )}
  </div>
);

export const MenuListWithSearch = (props) => {
  const { selectProps } = props;
  const {
    inputValue,
    onMenuInputFocus,
    onInputChange,
    inputRef,
    optionsLoadingState,
    darkMode,
    allOptions,
    autoAssignColors,
    onCreateTag,
  } = selectProps || {};

  return (
    <div
      className="table-select-custom-menu-list"
      style={{
        backgroundColor: 'var(--cc-surface1-surface)',
        minWidth: '200px',
        border: '1px solid var(--border-weak)',
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
          onCreateTag={onCreateTag}
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
 * list can be sorted.
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
          option.optionColor || (autoAssignColors ? COLORS[index % COLORS.length] : DEFAULT_TAG_BACKGROUND_COLOR);
        return acc;
      }, {}),
    [allOptions, autoAssignColors]
  );

  const getChipColor = useCallback(
    (optionValue) => {
      const matchedOption = allOptions.find((option) => option.value === optionValue);

      return {
        bg:
          optionColors?.[optionValue] ||
          (autoAssignColors ? getAutoAssignedChipColor(optionValue) : DEFAULT_TAG_BACKGROUND_COLOR),
        text: matchedOption?.labelColor || 'var(--text-primary)',
      };
    },
    [allOptions, optionColors, autoAssignColors]
  );

  const handleCreate = useCallback(
    (newLabel) => {
      const trimmed = (newLabel || '').trim();
      if (!trimmed) return;
      const newTag = { label: trimmed, value: trimmed };

      setIsFocused(false);

      if (isMulti) {
        const selectedItems = value == null || value === '' ? [] : isArray(value) ? value : [value];
        const rawItems = selectedItems.length ? selectedItems : defaultOptionsList;
        const currentValues = rawItems.map((currentValue) => {
          const rawValue = currentValue && typeof currentValue === 'object' ? currentValue.value : currentValue;
          const matchedOption = allOptions.find((option) => option.value === rawValue);

          return matchedOption || { label: String(rawValue), value: String(rawValue) };
        });
        const existsInSelection = currentValues.some(
          (currentValue) => String(currentValue?.value).toLowerCase() === trimmed.toLowerCase()
        );
        onChange(existsInSelection ? currentValues : [...currentValues, newTag]);
      } else {
        onChange(newTag);
      }
    },
    [allOptions, isMulti, value, defaultOptionsList, onChange, setIsFocused]
  );

  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (!menuIsOpen) {
      setInputValue('');
    }
  }, [menuIsOpen]);

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
    ...(!isMulti && {
      SingleValue: TagsSingleValue,
    }),
    ...(isMulti && {
      MultiValueRemove: TagsMultiValueRemove,
      MultiValueContainer: TagsMultiValueContainer,
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
        multiValue: (provided) => {
          return {
            ...provided,
            display: 'inline-flex',
            alignItems: 'center',
            marginRight: '4px',
            background: 'transparent',
          };
        },
        multiValueLabel: (provided) => {
          return {
            ...provided,
            padding: 0,
            background: 'transparent',
            borderRadius: 0,
            color: 'inherit',
            fontSize: 'inherit',
          };
        },
      }),
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
        border: 'unset',
      }),
    }),
    [darkMode, isMulti, horizontalAlignment]
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

  const resolveSelectedOption = useCallback(
    (item) => {
      if (item == null || item === '') return null;

      const rawValue = typeof item === 'object' ? item.value : item;
      const match = allOptions?.find((option) => option.value === rawValue);

      return (
        match || {
          label: String(rawValue),
          value: String(rawValue),
        }
      );
    },
    [allOptions]
  );

  const selectedValue = useMemo(() => {
    if (!value) return null;
    if (isMulti && value?.length) {
      const items = isArray(value) ? value : [value];
      return items.map(resolveSelectedOption).filter(Boolean);
    }
    const item = isArray(value) ? value[0] : value;
    return resolveSelectedOption(item) || [];
  }, [value, isMulti, resolveSelectedOption]);

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

  const handleInputChange = useCallback((newValue, { action } = {}) => {
    if (action === 'menu-close' || action === 'set-value') {
      setInputValue('');
      return '';
    }

    if (action === 'input-change') {
      setInputValue(newValue);
    }

    return newValue;
  }, []);

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
          className="w-100 h-100 d-flex align-items-center"
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
            isEditable={isEditable}
            menuIsOpen={menuIsOpen}
            isFocused={isFocused}
            optionColors={optionColors}
            optionsLoadingState={optionsLoadingState}
            allOptions={allOptions}
            onCreateTag={handleCreate}
            autoPickChipColor={autoAssignColors}
            selectedTextColor={textColor || 'var(--text-primary)'}
            tagBackgroundColor="var(--surfaces-surface-03)"
            getChipColor={getChipColor}
            inputRef={searchInputRef}
            inputValue={inputValue}
            onInputChange={handleInputChange}
            onMenuClose={() => setInputValue('')}
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
