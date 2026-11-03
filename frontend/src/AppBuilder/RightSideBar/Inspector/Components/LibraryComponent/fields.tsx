import React, { useEffect, useMemo, useState } from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import { VirtuosoGrid } from 'react-virtuoso';
import type { LucideIcon } from 'lucide-react';

import ColorSwatches from '@/modules/Appbuilder/components/ColorSwatches';
import { SearchBox } from '@/_components/SearchBox';

const ColorSwatchesComponent = ColorSwatches as React.ComponentType<any>;
const SearchBoxComponent = SearchBox as React.ComponentType<any>;

// Small inspector fields for the list editors' popovers, drawn with the native inspector's classes. Text commits on
// blur and Enter rather than per keystroke, so typing a label saves once.

const LABEL = 'font-weight-500 mb-1 font-size-12 d-block';

export const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="field mb-3">
    <span className={LABEL}>{label}</span>
    {children}
  </div>
);

export const TextField = ({
  label,
  value,
  placeholder,
  onCommit,
  list,
  cy,
}: {
  label: string;
  value: unknown;
  placeholder?: string;
  onCommit: (value: string) => void;
  list?: string;
  cy?: string;
}) => {
  const shown = value === undefined || value === null ? '' : String(value);
  const [draft, setDraft] = useState(shown);
  useEffect(() => setDraft(shown), [shown]);
  const commit = () => draft !== shown && onCommit(draft);
  return (
    <Field label={label}>
      <input
        type="text"
        className="form-control text-field"
        aria-label={label}
        data-cy={cy}
        placeholder={placeholder}
        list={list}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
      />
    </Field>
  );
};

/** A number, or nothing when cleared (the key is dropped so the component's default applies). */
export const NumberField = ({
  label,
  value,
  placeholder,
  onCommit,
}: {
  label: string;
  value: unknown;
  placeholder?: string;
  onCommit: (value: number | undefined) => void;
}) => (
  <TextField
    label={label}
    value={value}
    placeholder={placeholder}
    onCommit={(text) => {
      const n = Number(text);
      onCommit(text.trim() === '' || !Number.isFinite(n) ? undefined : n);
    }}
  />
);

export const SelectField = ({
  label,
  value,
  options,
  onChange,
  cy,
}: {
  label: string;
  value: string;
  options: [string, string][];
  onChange: (value: string) => void;
  cy?: string;
}) => (
  <Field label={label}>
    <select
      className="form-control text-field"
      aria-label={label}
      data-cy={cy}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </select>
  </Field>
);

export const SwitchField = ({
  label,
  checked,
  onChange,
  cy,
}: {
  label: string;
  checked: boolean;
  onChange: (on: boolean) => void;
  cy?: string;
}) => (
  <label
    className="form-check form-switch mb-2 d-flex align-items-center justify-content-between ps-0"
    style={{ gap: 8 }}
  >
    <span className="font-weight-500 font-size-12">{label}</span>
    <input
      className="form-check-input ms-0"
      type="checkbox"
      checked={checked}
      aria-label={label}
      data-cy={cy}
      onChange={(e) => onChange(e.target.checked)}
    />
  </label>
);

/** The native colour field: theme swatches and a custom colour, as a style's colour field shows them. */
export const ColorField = ({
  label,
  value,
  onChange,
  cy,
}: {
  label?: string;
  value: unknown;
  onChange: (value: string) => void;
  cy?: string;
}) => {
  const picker = (
    <ColorSwatchesComponent
      value={typeof value === 'string' ? value : ''}
      onChange={onChange}
      cyLabel={cy ?? 'color'}
      outerWidth="100%"
      meta={{ colorPickerPosition: 'left' }}
    />
  );
  return label ? <Field label={label}>{picker}</Field> : picker;
};

// ---- Icon picker ---------------------------------------------------------------------------------------------------

type IconMap = Record<string, LucideIcon>;
let iconMap: IconMap | null = null;
let iconMapLoad: Promise<IconMap> | null = null;

// lucide's whole map, loaded when a picker first opens rather than with the editor.
const loadIcons = (): Promise<IconMap> => {
  if (iconMap) return Promise.resolve(iconMap);
  iconMapLoad ??= import('lucide-react').then((m) => (iconMap = m.icons as IconMap));
  return iconMapLoad;
};

const useIcons = (): IconMap | null => {
  const [icons, setIcons] = useState<IconMap | null>(iconMap);
  useEffect(() => {
    if (!icons) loadIcons().then(setIcons);
  }, [icons]);
  return icons;
};

/** The lucide icon a pack resolves a name to: kebab, snake, camel or Pascal case, or a Tabler name (IconBell). */
export const findIcon = (icons: IconMap | null, name: unknown): LucideIcon | null => {
  if (!icons || typeof name !== 'string' || !name.trim()) return null;
  const parts = name
    .trim()
    .split(/[-_\s]+/)
    .filter(Boolean);
  const pascal = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('');
  for (const candidate of [pascal, pascal.replace(/Icon$/, ''), pascal.replace(/^Icon(?=[A-Z])/, '')]) {
    if (icons[candidate]) return icons[candidate];
  }
  return null;
};

/**
 * An icon name field: a searchable grid of the lucide icons the pack draws, writing the icon's lucide name. A name
 * typed elsewhere (a Tabler name, kebab case) still shows its icon when the pack would resolve it.
 */
export const IconPicker = ({
  value,
  onChange,
  darkMode,
  allowNone = true,
  cy = 'icon',
}: {
  value: unknown;
  onChange: (value: string) => void;
  darkMode: boolean;
  allowNone?: boolean;
  cy?: string;
}) => {
  const icons = useIcons();
  const [show, setShow] = useState(false);
  const [search, setSearch] = useState('');
  const names = useMemo(() => Object.keys(icons ?? {}), [icons]);
  const filtered = useMemo(() => {
    const q = search
      .trim()
      .toLowerCase()
      .replace(/[-_\s]+/g, '');
    return q ? names.filter((n) => n.toLowerCase().includes(q)) : names;
  }, [names, search]);
  const Current = findIcon(icons, value);
  const name = typeof value === 'string' ? value : '';
  const color = darkMode ? '#fff' : '#000';

  const popover = (
    <Popover
      style={{ width: 340, maxWidth: 340 }}
      className={`icon-widget-popover ${darkMode ? 'dark-theme theme-dark' : ''}`}
      onClick={(e) => e.stopPropagation()}
    >
      <Popover.Header>
        <SearchBoxComponent onSubmit={setSearch} width="100%" dataCy={`${cy}-search`} />
      </Popover.Header>
      <Popover.Body>
        {allowNone && (
          <button
            type="button"
            className="btn btn-sm btn-link p-0 mb-2 font-size-12"
            data-cy={`${cy}-none`}
            onClick={() => {
              onChange('');
              setShow(false);
            }}
          >
            No icon
          </button>
        )}
        <VirtuosoGrid
          style={{ height: 260 }}
          totalCount={filtered.length}
          listClassName="icon-list-wrapper"
          itemClassName="icon-list"
          itemContent={(index) => {
            const iconName = filtered[index];
            const IconElement = icons?.[iconName];
            if (!IconElement) return null;
            return (
              <div
                className="icon-element p-2"
                title={iconName}
                data-cy={`${cy}-option-${iconName}`}
                onClick={() => {
                  onChange(iconName);
                  setShow(false);
                }}
              >
                <IconElement color={color} strokeWidth={1.5} style={{ width: 22, height: 22 }} />
              </div>
            );
          }}
        />
      </Popover.Body>
    </Popover>
  );

  return (
    <OverlayTrigger trigger="click" placement="left" show={show} onToggle={setShow} rootClose overlay={popover}>
      <div
        className="color-picker-input d-flex align-items-center"
        role="button"
        data-cy={`${cy}-picker`}
        style={{ height: 32, borderRadius: 6, padding: '0 8px', gap: 6, background: 'var(--slate3)' }}
      >
        <span style={{ width: 18, height: 18, display: 'inline-flex' }}>
          {Current && <Current color={color} strokeWidth={1.5} style={{ width: 18, height: 18 }} />}
        </span>
        <span className="text-truncate tj-text-xsm" style={{ color: name ? 'var(--slate12)' : 'var(--slate9)' }}>
          {name || 'No icon'}
        </span>
      </div>
    </OverlayTrigger>
  );
};

export const IconField = ({
  label,
  value,
  onChange,
  darkMode,
  cy,
}: {
  label: string;
  value: unknown;
  onChange: (value: string | undefined) => void;
  darkMode: boolean;
  cy?: string;
}) => (
  <Field label={label}>
    <IconPicker value={value} onChange={(v) => onChange(v || undefined)} darkMode={darkMode} cy={cy} />
  </Field>
);
