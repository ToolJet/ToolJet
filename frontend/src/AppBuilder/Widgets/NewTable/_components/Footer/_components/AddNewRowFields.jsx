import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, CircleX, Link, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox, Input, Popover, PopoverContent, PopoverTrigger, Switch, Textarea } from '@/components/ui/Rocket';
import { HTMLRenderer } from '@/AppBuilder/Shared/DataTypes/renderers/HTMLRenderer';
import { MarkdownRenderer } from '@/AppBuilder/Shared/DataTypes/renderers/MarkdownRenderer';
import { SCROLL_AREA_CLASS } from '../../../_utils/addNewRowTheme';

// Figma frame 2628:86086 draws every control 36px high with 14px text, a size between Rocket's default (32) and
// large (40), so each Rocket control below overrides its height and font size.
// The family is never set here: the table renders in the page's IBM Plex Sans, and the Inter-based `tw-font-*`
// typography utilities would put the form in a different font. Native controls do not inherit a family on their
// own (the CSS reset is off), so they ask for it.
const FONT_INHERIT_CLASS = '[font-family:inherit]';
// The shadcn Input/Textarea base also carries `md:tw-text-sm`, which beats a plain `tw-text-lg` at desktop widths.
const TEXT_SIZE_CLASS = 'tw-text-lg md:tw-text-lg';
const CONTROL_SIZE_CLASS = `tw-h-9 ${TEXT_SIZE_CLASS} ${FONT_INHERIT_CLASS}`;
const BOX_CLASS = `tw-w-full tw-rounded-md tw-border tw-border-solid tw-border-border-default tw-bg-background-surface-layer-01 tw-text-lg ${FONT_INHERIT_CLASS} tw-text-text-default aria-[invalid=true]:tw-border-border-danger-strong aria-[invalid=true]:tw-bg-background-error-weak`;
// The select/popover menus render in a portal, so they need a layer above the table popover (z-index 100) and
// above a dialog (the builder lifts Rocket dialogs to z-index 1050).
const MENU_LAYER_CLASS = 'tw-z-[1060]';

// aria-invalid also drives the red border and tint of the Rocket inputs and of the boxes above.
const invalidAria = (invalid, errorId) => (invalid ? { 'aria-invalid': 'true', 'aria-describedby': errorId } : {});

const URL_TYPES = ['link', 'image'];
const RICH_TEXT_TYPES = ['html', 'markdown'];
// Toggle-like types read as "[control] Label"; radio reads as "Label  (o) A  (o) B".
const LABEL_AFTER_TYPES = ['boolean', 'toggle'];
const LABEL_BEFORE_TYPES = ['radio'];

export const getFieldKind = (columnType, { allowMultipleTags = false } = {}) => {
  if (columnType === 'number') return 'number';
  if (columnType === 'boolean') return 'switch';
  if (columnType === 'select' || (columnType === 'tagsV2' && !allowMultipleTags)) return 'select';
  if (columnType === 'newMultiSelect' || columnType === 'tagsV2') return 'chips';
  if (columnType === 'json') return 'json';
  if (RICH_TEXT_TYPES.includes(columnType)) return 'richtext';
  if (columnType === 'text') return 'textarea';
  if (!columnType || ['string', 'default', ...URL_TYPES].includes(columnType)) return 'text';
  return 'renderer';
};

export const getFieldLayout = (columnType) => {
  if (LABEL_AFTER_TYPES.includes(columnType)) return 'label-after';
  if (LABEL_BEFORE_TYPES.includes(columnType)) return 'label-before';
  return 'stacked';
};

const isBlank = (value) => value === undefined || value === null || value === '';
const rawValue = (value) => (value !== null && typeof value === 'object' && 'value' in value ? value.value : value);

export const TextControl = ({ labelId, value, onChange, columnType, invalid, errorId }) => {
  const isUrl = URL_TYPES.includes(columnType);
  return (
    <div className="tw-relative tw-w-full">
      {isUrl && (
        <Link size={16} className="tw-pointer-events-none tw-absolute tw-left-2.5 tw-top-2.5 tw-text-icon-default" />
      )}
      <Input
        type="text"
        aria-labelledby={labelId}
        {...invalidAria(invalid, errorId)}
        value={value ?? ''}
        placeholder={isUrl ? 'https://' : 'Enter text'}
        onChange={(event) => onChange(event.target.value)}
        className={cn(CONTROL_SIZE_CLASS, isUrl && 'tw-pl-8')}
      />
    </div>
  );
};

export const TextAreaControl = ({ labelId, value, onChange, invalid, errorId }) => (
  <Textarea
    aria-labelledby={labelId}
    {...invalidAria(invalid, errorId)}
    value={value ?? ''}
    placeholder="Enter text"
    rows={2}
    onChange={(event) => onChange(event.target.value)}
    className={`tw-min-h-14 ${TEXT_SIZE_CLASS} ${FONT_INHERIT_CLASS}`}
  />
);

const STEPPER_BUTTON_CLASS =
  'tw-flex tw-h-1/2 tw-w-full tw-items-center tw-justify-center tw-border-0 tw-bg-transparent tw-p-0 tw-text-icon-default hover:tw-bg-interactive-hover';

export const NumberControl = ({ labelId, value, onChange, invalid, errorId }) => {
  const step = (delta) => onChange((Number(value) || 0) + delta);
  return (
    <div
      {...invalidAria(invalid, errorId)}
      className={cn(
        BOX_CLASS,
        'tw-flex tw-h-9 tw-items-stretch tw-overflow-hidden hover:tw-border-border-strong focus-within:tw-border-border-accent-strong'
      )}
    >
      <input
        type="number"
        aria-labelledby={labelId}
        {...invalidAria(invalid, errorId)}
        value={value ?? ''}
        placeholder="Enter number"
        onChange={(event) => onChange(event.target.value === '' ? null : Number(event.target.value))}
        className="tw-h-full tw-min-w-0 tw-flex-1 tw-border-0 tw-bg-transparent tw-px-3 tw-text-lg [font-family:inherit] tw-text-text-default placeholder:tw-text-text-placeholder focus:tw-outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:tw-appearance-none [&::-webkit-outer-spin-button]:tw-appearance-none"
      />
      <div className="tw-flex tw-w-5 tw-shrink-0 tw-flex-col tw-border-0 tw-border-l tw-border-solid tw-border-border-default">
        <button
          type="button"
          aria-label="Increase"
          tabIndex={-1}
          onClick={() => step(1)}
          className={STEPPER_BUTTON_CLASS}
        >
          <ChevronUp size={12} />
        </button>
        <button
          type="button"
          aria-label="Decrease"
          tabIndex={-1}
          onClick={() => step(-1)}
          className={STEPPER_BUTTON_CLASS}
        >
          <ChevronDown size={12} />
        </button>
      </div>
    </div>
  );
};

// The pill the table draws around an option label: the option's own colours, else the neutral surface.
const OptionPill = ({ option, className }) => (
  <span
    className={cn('table-select-menu-pill', className)}
    style={{
      background: option?.optionColor || 'var(--surfaces-surface-03)',
      color: option?.labelColor || 'var(--text-primary)',
    }}
  >
    {option?.label}
  </span>
);

// The table's own select menu: a search box over rows of "checkbox + pill". It is rendered with the same class
// names the table uses (table-component.scss), so fonts, the 12px 8px row padding, pills and hover colours match
// it exactly in light and dark. For a single select only the chosen row shows its checkbox, as in the table.
const OptionsMenu = ({ options, multiple, isSelected, onPick }) => {
  const [query, setQuery] = useState('');
  const visible = options.filter((option) =>
    String(option.label ?? '')
      .toLowerCase()
      .includes(query.trim().toLowerCase())
  );

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
        {!query && <Search size={14} className="tw-shrink-0 tw-text-icon-default" />}
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search..."
          aria-label="Search options"
          className={`table-select-column-type-search-box ${FONT_INHERIT_CLASS}`}
          autoComplete="off"
          spellCheck={false}
        />
      </div>
      <div style={{ borderTop: '1px solid var(--cc-default-border)' }}>
        <div
          role="listbox"
          aria-multiselectable={multiple || undefined}
          className={`react-select__menu-list ${SCROLL_AREA_CLASS}`}
          style={{ maxHeight: '300px', overflowY: 'auto' }}
        >
          {visible.length === 0 && <div className="tw-p-3 tw-text-center tw-text-text-placeholder">No options</div>}
          {visible.map((option, index) => {
            const selected = isSelected(option.value);
            return (
              <div
                key={`${option.value}-${index}`}
                role="option"
                aria-label={option.label}
                aria-selected={selected}
                tabIndex={0}
                className="option-wrapper d-flex tw-cursor-pointer tw-gap-2"
                onClick={() => onPick(option.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onPick(option.value);
                  }
                }}
              >
                <div
                  style={{ visibility: multiple || selected ? 'visible' : 'hidden' }}
                  onClick={(event) => event.stopPropagation()}
                >
                  <Checkbox
                    aria-label={option.label}
                    tabIndex={-1}
                    checked={selected}
                    onCheckedChange={() => onPick(option.value)}
                  />
                </div>
                <OptionPill option={option} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const MENU_CONTENT_CLASS = (darkMode) =>
  cn(
    MENU_LAYER_CLASS,
    'tw-w-[var(--radix-popover-trigger-width)] tw-min-w-[200px] tw-gap-0 tw-border-0 tw-bg-transparent tw-p-0 tw-shadow-none',
    darkMode && 'dark-theme'
  );

const TRIGGER_BOX_CLASS = cn(
  BOX_CLASS,
  'tw-flex tw-min-h-9 tw-cursor-pointer tw-items-center tw-gap-1 hover:tw-border-border-strong focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-interactive-focus-outline'
);

// Single choice. A column's configured default option shows (without being stored) while nothing is chosen,
// the same as in the table cell; choosing the selected option again clears it, also as in the table.
export const SelectControl = ({
  labelId,
  options,
  value,
  defaultValue,
  placeholder,
  onChange,
  darkMode,
  invalid,
  errorId,
}) => {
  const [open, setOpen] = useState(false);
  const current = isBlank(value) ? defaultValue : value;
  const selected = options.find((option) => option.value === current);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-labelledby={labelId}
          {...invalidAria(invalid, errorId)}
          aria-expanded={open}
          aria-haspopup="listbox"
          className={cn(TRIGGER_BOX_CLASS, 'tw-justify-between tw-px-3')}
        >
          {selected ? (
            <OptionPill option={selected} className="tw-text-base" />
          ) : (
            <span className="tw-text-text-placeholder">{placeholder || 'Select'}</span>
          )}
          <ChevronDown size={16} className="tw-ml-auto tw-shrink-0 tw-text-icon-default" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className={MENU_CONTENT_CLASS(darkMode)}>
        <OptionsMenu
          options={options}
          isSelected={(optionValue) => optionValue === current}
          onPick={(optionValue) => {
            onChange(optionValue === current ? '' : optionValue);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
};

// Several choices, shown as removable pills with a clear button and a chevron. The options open in the table's
// select menu. Values are stored as a plain array, in the order they were picked.
export const ChipsControl = ({
  labelId,
  options,
  value,
  defaultValues,
  placeholder,
  onChange,
  darkMode,
  invalid,
  errorId,
}) => {
  const [open, setOpen] = useState(false);
  const selectedValues = (Array.isArray(value) ? value : isBlank(value) ? defaultValues : []).map(rawValue);
  const optionOf = (selectedValue) =>
    options.find((option) => option.value === selectedValue) ?? { label: selectedValue, value: selectedValue };
  const toggle = (optionValue) =>
    onChange(
      selectedValues.includes(optionValue)
        ? selectedValues.filter((candidate) => candidate !== optionValue)
        : [...selectedValues, optionValue]
    );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          role="combobox"
          tabIndex={0}
          aria-labelledby={labelId}
          {...invalidAria(invalid, errorId)}
          aria-expanded={open}
          aria-haspopup="listbox"
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              setOpen(true);
            }
          }}
          className={cn(TRIGGER_BOX_CLASS, 'tw-py-1 tw-pl-1.5 tw-pr-2')}
        >
          <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-wrap tw-items-center tw-gap-1">
            {selectedValues.length === 0 && (
              <span className="tw-px-1.5 tw-text-text-placeholder">{placeholder || 'Select'}</span>
            )}
            {selectedValues.map((selectedValue) => {
              const option = optionOf(selectedValue);
              return (
                <span
                  key={String(selectedValue)}
                  className="table-select-menu-pill tw-inline-flex tw-items-center tw-gap-1 tw-py-1 tw-pl-[7px] tw-pr-1"
                  style={{
                    background: option.optionColor || 'var(--surfaces-surface-03)',
                    color: option.labelColor || 'var(--text-primary)',
                  }}
                >
                  {option.label}
                  <button
                    type="button"
                    aria-label={`Remove ${option.label}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      toggle(selectedValue);
                    }}
                    className="tw-flex tw-h-4 tw-w-4 tw-items-center tw-justify-center tw-rounded-sm tw-border-0 tw-bg-transparent tw-p-0 tw-text-icon-default hover:tw-bg-interactive-hover"
                  >
                    <X size={12} />
                  </button>
                </span>
              );
            })}
          </div>
          {selectedValues.length > 0 && (
            <button
              type="button"
              aria-label="Clear selection"
              onClick={(event) => {
                event.stopPropagation();
                onChange([]);
              }}
              className="tw-flex tw-h-5 tw-w-5 tw-shrink-0 tw-items-center tw-justify-center tw-border-0 tw-bg-transparent tw-p-0 tw-text-icon-default"
            >
              <CircleX size={14} />
            </button>
          )}
          <ChevronDown size={16} className="tw-shrink-0 tw-text-icon-default" />
        </div>
      </PopoverTrigger>
      <PopoverContent align="start" className={MENU_CONTENT_CLASS(darkMode)}>
        <OptionsMenu
          options={options}
          multiple
          isSelected={(optionValue) => selectedValues.includes(optionValue)}
          onPick={toggle}
        />
      </PopoverContent>
    </Popover>
  );
};

export const SwitchControl = ({ labelId, value, onChange }) => (
  <Switch aria-labelledby={labelId} checked={!!value} onCheckedChange={onChange} />
);

const prettyJson = (value) => {
  if (isBlank(value)) return '';
  try {
    return JSON.stringify(typeof value === 'string' ? JSON.parse(value) : value, null, 2);
  } catch {
    return String(value);
  }
};

// JSON column: typed as text, stored as a compact JSON string like the table cell does. Text that is not valid
// JSON stays in the draft exactly as typed, so validation can flag it instead of it vanishing.
export const JsonControl = ({ labelId, value, onChange, invalid, errorId }) => {
  const [text, setText] = useState(() => prettyJson(value));
  const lastEmitted = useRef(value);
  const emit = (next) => {
    lastEmitted.current = next;
    onChange(next);
  };

  // the draft changed from outside (cleared, reset): show it
  useEffect(() => {
    if (value !== lastEmitted.current) {
      lastEmitted.current = value;
      setText(prettyJson(value));
    }
  }, [value]);

  return (
    <Textarea
      aria-labelledby={labelId}
      {...invalidAria(invalid, errorId)}
      value={text}
      placeholder='{ "key": "value" }'
      rows={3}
      spellCheck={false}
      onChange={(event) => {
        setText(event.target.value);
        emit(event.target.value);
      }}
      onBlur={() => {
        try {
          const parsed = JSON.parse(text);
          setText(JSON.stringify(parsed, null, 2));
          emit(JSON.stringify(parsed));
        } catch {
          // not valid JSON yet: keep what was typed
        }
      }}
      className={`tw-min-h-14 ${TEXT_SIZE_CLASS} ${FONT_INHERIT_CLASS}`}
    />
  );
};

// HTML and Markdown columns: raw text while editing, the rendered result once focus leaves (click it to edit
// again). The preview is the table's own renderer in read-only mode, so it renders and sanitises the same way.
export const RichTextControl = ({ labelId, value, onChange, columnType, darkMode, invalid, errorId }) => {
  const [editing, setEditing] = useState(false);
  const text = isBlank(value) ? '' : String(value);

  if (!editing && text !== '') {
    const Preview = columnType === 'html' ? HTMLRenderer : MarkdownRenderer;
    return (
      <div
        role="button"
        tabIndex={0}
        aria-labelledby={labelId}
        {...invalidAria(invalid, errorId)}
        onClick={() => setEditing(true)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setEditing(true);
          }
        }}
        className={cn(BOX_CLASS, 'tw-min-h-14 tw-cursor-text tw-px-3 tw-py-2')}
      >
        <Preview value={text} isEditable={false} darkMode={darkMode} />
      </div>
    );
  }

  return (
    <Textarea
      aria-labelledby={labelId}
      {...invalidAria(invalid, errorId)}
      value={text}
      placeholder={columnType === 'html' ? '<p>HTML</p>' : 'Markdown'}
      rows={3}
      autoFocus={editing}
      onFocus={() => setEditing(true)}
      onBlur={() => setEditing(false)}
      onChange={(event) => onChange(event.target.value)}
      className={`tw-min-h-14 ${TEXT_SIZE_CLASS} ${FONT_INHERIT_CLASS}`}
    />
  );
};

// Wraps a table cell renderer (date picker, radio, rating...) so it sits in the form like a field. These
// are the same renderers the table and the key-value widget use, so the control keeps the app-wide behaviour;
// `table-add-new-row-field-control` (table-component.scss) only restyles the date input to the Figma field.
export const RendererControl = ({ children, invalid }) => (
  <div
    className="table-add-new-row-field-control tw-flex tw-w-full tw-items-center"
    data-invalid={invalid ? 'true' : undefined}
  >
    {children}
  </div>
);
