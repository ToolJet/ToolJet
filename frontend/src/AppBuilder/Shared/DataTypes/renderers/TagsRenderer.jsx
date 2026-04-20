import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import Select from '@/_ui/Select';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { Checkbox } from '@/_ui/CheckBox/CheckBox';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { isArray } from 'lodash';
import TagsInputMenuList from '@/AppBuilder/Widgets/TagsInput/TagsInputMenuList';
import defaultStyles from '@/_ui/Select/styles';

const COLORS = [
  '#40474D33',
  '#CE276133',
  '#6745E233',
  '#2576CE33',
  '#1A9C6D33',
  '#69AF2033',
  '#F3571733',
  '#EB2E3933',
  '#A438C033',
  '#405DE633',
  '#1E8FA333',
  '#34A94733',
  '#F1911933',
];

const sortOptions = (opts, sortTags) => {
  if (!sortTags || sortTags === 'none') return opts;
  return [...opts].sort((a, b) => {
    const cmp = (a.label || '').localeCompare(b.label || '');
    return sortTags === 'a-z' ? cmp : -cmp;
  });
};

const CustomOption = ({ innerRef, innerProps, children, isSelected, ...props }) => {
  const { label, value, data } = props;
  const { optionColors } = props.selectProps;

  return (
    <div
      ref={innerRef}
      {...innerProps}
      className="option-wrapper d-flex"
      style={{ backgroundColor: 'var(--cc-surface1-surface)' }}
    >
      {props.selectProps.isMulti ? (
        <Checkbox label="" isChecked={isSelected} onChange={(e) => e.stopPropagation()} key="" value={children} />
      ) : (
        <div style={{ visibility: isSelected ? 'visible' : 'hidden' }}>
          <Checkbox label="" isChecked={isSelected} onChange={(e) => e.stopPropagation()} key="" value={children} />
        </div>
      )}
      <div
        className="table-select-menu-pill"
        style={{
          background: optionColors?.[value] || 'var(--surfaces-surface-03)',
          color: data?.labelColor || 'var(--text-primary)',
          padding: '2px 6px',
          borderRadius: '6px',
          fontSize: '12px',
        }}
      >
        {label}
      </div>
    </div>
  );
};

const MultiValueRemove = ({ innerProps }) => <div {...innerProps} />;

const CustomMultiValueContainer = ({ children }) => (
  <div
    style={{
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
    }}
  >
    {children}
  </div>
);

const DropdownIndicator = ({ selectProps }) => {
  return (
    <div
      className="cell-icon-display"
      style={{ alignSelf: 'center' }}
      onMouseDown={(e) => {
        const isOpen = selectProps.menuIsOpen;
        selectProps.onMenuOpen(!isOpen);

        const tdElement = e.currentTarget.closest('td');
        if (tdElement) {
          const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window,
          });
          tdElement.dispatchEvent(clickEvent);
        }
      }}
    >
      <SolidIcon
        name={selectProps.menuIsOpen ? 'arrowUpTriangle' : 'arrowDownTriangle'}
        width="16"
        height="16"
        fill="#6A727C"
      />
    </div>
  );
};

const getOverlay = (value, darkMode) => {
  if (!isArray(value)) return <div />;

  return (
    <div
      style={{ maxWidth: '266px' }}
      className={`overlay-cell-table overlay-multiselect-table ${darkMode ? 'dark-theme' : ''}`}
    >
      {value.map((option) => (
        <span
          key={option.label || option}
          style={{
            padding: '2px 6px',
            background: 'var(--surfaces-surface-03)',
            borderRadius: '6px',
            color: 'var(--text-primary)',
            fontSize: '12px',
          }}
        >
          {option.label || option}
        </span>
      ))}
    </div>
  );
};

/**
 * TagsRenderer — creatable tags dropdown for the Table TagsV2 column.
 *
 * Distinct from SelectRenderer: users can create new tag options at runtime
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
  autoAssignColors = true,
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
  const [runtimeTags, setRuntimeTags] = useState([]);

  const allOptions = useMemo(() => [...options, ...runtimeTags], [options, runtimeTags]);
  const sortedOptions = useMemo(() => sortOptions(allOptions, sortTags), [allOptions, sortTags]);

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
      setRuntimeTags((prev) => (prev.some((t) => t.value === trimmed) ? prev : [...prev, newTag]));
      if (isMulti) {
        const currentValues = isArray(value) ? value.map((v) => (v && typeof v === 'object' ? v.value : v)) : [];
        onChange([...currentValues, trimmed]);
      } else {
        onChange(trimmed);
      }
    },
    [isMulti, value, onChange]
  );

  const isValidNewOption = useCallback(
    (input) => {
      if (!input || !input.trim()) return false;
      const trimmed = input.trim().toLowerCase();
      return !allOptions.some((o) => o.value?.toLowerCase() === trimmed);
    },
    [allOptions]
  );

  const containerRef = useRef(null);

  useEffect(() => {
    if (!isMulti && !isNewRow) return;
    const handleDocumentClick = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setIsFocused?.(false);
      }
    };
    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, [isMulti, isNewRow, setIsFocused]);

  const customComponents = {
    MenuList: (props) => (
      <TagsInputMenuList
        {...props}
        allowNewTags
        inputValue={props.selectProps?.inputValue}
        optionsLoadingState={optionsLoadingState}
        darkMode={darkMode}
        allOptions={allOptions}
        onCreateTag={handleCreate}
        autoPickChipColor={autoAssignColors}
      />
    ),
    Option: CustomOption,
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
    const valueContainer = containerRef.current.querySelector('.react-select__value-container');
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
            hasSearch
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
            hideSelectedOptions={false}
            isClearable={false}
            clearIndicator={false}
            darkMode={darkMode}
            menuIsOpen={menuIsOpen}
            isFocused={isFocused}
            optionColors={optionColors}
            creatable
            onCreateOption={handleCreate}
            formatCreateLabel={() => null}
            isValidNewOption={isValidNewOption}
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
