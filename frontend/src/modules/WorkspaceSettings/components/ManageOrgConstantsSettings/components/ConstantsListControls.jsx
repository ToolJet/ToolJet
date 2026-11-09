import React, { forwardRef, useRef, useState } from 'react';
import { ArrowDownWideNarrow, ChevronDown, Funnel, X } from 'lucide-react';
import { Button, Input } from '@/components/ui/Rocket';
import DropdownMenu from '@/components/ui/Rocket/DropdownMenu';
import Tooltip from '@/components/ui/Rocket/Tooltip';
import { CONSTANT_SOURCES, DEFAULT_SORT } from '../hooks/useConstantsListQueryParams';

const SORT_GROUPS = [
  {
    id: 'name',
    label: 'Name',
    options: [
      { value: 'name_asc', label: 'A → Z' },
      { value: 'name_desc', label: 'Z → A' },
    ],
  },
  {
    id: 'modified',
    label: 'Last modified',
    options: [
      { value: 'modified_desc', label: 'Newest first' },
      { value: 'modified_asc', label: 'Oldest first' },
    ],
  },
];

const SOURCE_OPTIONS = [
  { value: 'workspace', label: 'Workspace' },
  { value: 'env', label: '.env variables' },
];

const ICON_SIZE = 14;
const ICON_CLASS = 'tw-text-icon-strong';

// A menu trigger that names itself in a tooltip. The menu hands its props and ref to this component, which passes
// them on to the button; the tooltip then adds its own on top.
const IconTrigger = forwardRef(function IconTrigger({ label, children, ...props }, ref) {
  return (
    <Tooltip content={label}>
      <Button ref={ref} variant="ghost" size="medium" iconOnly aria-label={label} {...props}>
        {children}
      </Button>
    </Tooltip>
  );
});
// The design's rows are 30px; the shared menu default is 32px.
const MENU_CLASSES = { item: 'tw-h-[30px]' };
// Rows of a menu with a search input also highlight on hover: while the input is focused they cannot take focus to
// show it. The design's group labels are 30px rows like the options.
const SEARCHABLE_MENU_CLASSES = {
  content: 'tw-w-[212px]',
  item: 'tw-h-[30px] hover:tw-bg-interactive-hover',
  label: 'tw-flex tw-h-[30px] tw-items-center tw-py-0',
};

function EnvSelect({ environments, environmentId, onEnvChange }) {
  const current = environments.find((environment) => environment.id === environmentId);
  return (
    <DropdownMenu
      compact
      align="end"
      classes={MENU_CLASSES}
      sections={[
        {
          id: 'environment',
          type: 'radio',
          value: environmentId,
          onValueChange: onEnvChange,
          items: environments.map(({ id, name }) => ({ value: id, label: name })),
        },
      ]}
      trigger={
        <Button
          variant="ghost"
          size="medium"
          aria-label="Environment"
          trailingVisual={<ChevronDown size={ICON_SIZE} />}
        >
          {current?.name}
        </Button>
      }
    />
  );
}

// State shared by the menus that start with a search input.
function useMenuSearch() {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  // Radix focuses an item on hover and refocuses the menu when the pointer leaves it. Cancelling that while the
  // input has focus keeps the user typing.
  const keepInputFocus = (event) => {
    if (document.activeElement === inputRef.current) event.preventDefault();
  };

  return { query, setQuery, inputRef, needle: query.trim().toLowerCase(), keepInputFocus };
}

// The design's menu header: a search input and a text action, sharing one divider with the rows below.
function MenuSearchHeader({ search, placeholder, actionLabel, onAction }) {
  return (
    <div className="tw-box-border tw-flex tw-h-10 tw-items-center tw-gap-2 tw-border-0 tw-border-b tw-border-solid tw-border-border-weak tw-pr-3">
      <Input
        ref={search.inputRef}
        value={search.query}
        onChange={(event) => search.setQuery(event.target.value)}
        // Radix menus jump to the item matching a typed character; typed characters must stay in the input.
        // Arrow keys still pass through so the keyboard can reach the options.
        onKeyDown={(event) => event.key.length === 1 && event.stopPropagation()}
        placeholder={placeholder}
        aria-label={placeholder}
        // md:tw-text-base undoes the shadcn input base that drops to 11px on desktop; the design's field is 12px.
        className="tw-min-w-0 tw-flex-1 tw-rounded-default tw-border-0 tw-bg-transparent tw-px-2 tw-font-body-default md:tw-text-base focus-visible:tw-ring-inset"
      />
      <button
        type="button"
        onClick={onAction}
        className="tw-shrink-0 tw-cursor-pointer tw-border-0 tw-bg-transparent tw-p-0 tw-font-body-default tw-text-text-accent"
      >
        {actionLabel}
      </button>
    </div>
  );
}

const NoResults = () => <p className="tw-m-0 tw-p-4 tw-font-body-default tw-text-text-placeholder">No results</p>;

function FilterMenu({ source, onSourceChange }) {
  const search = useMenuSearch();
  const options = SOURCE_OPTIONS.filter(({ label }) => label.toLowerCase().includes(search.needle));
  const allSources = source.length === CONSTANT_SOURCES.length;

  const toggle = (value, checked) => {
    const next = CONSTANT_SOURCES.filter((s) => (s === value ? checked : source.includes(s)));
    // The last checked source stays checked: an empty selection would silently fall back to all sources.
    if (next.length) onSourceChange(next);
  };

  // Does nothing when there is nothing to clear: a source change also resets the page and the row selection.
  const clearAll = () => {
    search.setQuery('');
    if (!allSources) onSourceChange(CONSTANT_SOURCES);
  };

  const header = (
    <MenuSearchHeader search={search} placeholder="Filter by" actionLabel="Clear all" onAction={clearAll} />
  );

  const sections = [
    { id: 'search', content: header },
    {
      id: 'source',
      separator: false,
      label: 'Source',
      items: options.map(({ value, label }) => ({
        id: value,
        type: 'checkbox',
        keepOpen: true,
        label,
        checked: source.includes(value),
        onPointerMove: search.keepInputFocus,
        onPointerLeave: search.keepInputFocus,
        onCheckedChange: (checked) => toggle(value, checked),
      })),
    },
  ];

  return (
    <DropdownMenu
      compact
      align="end"
      classes={SEARCHABLE_MENU_CLASSES}
      onOpenChange={(open) => !open && search.setQuery('')}
      sections={options.length ? sections : [sections[0], { id: 'empty', separator: false, content: <NoResults /> }]}
      trigger={
        <IconTrigger label="Filter">
          <Funnel size={ICON_SIZE} className={ICON_CLASS} />
        </IconTrigger>
      }
    />
  );
}

function SortMenu({ sort, onSortChange }) {
  const search = useMenuSearch();
  // An option stays when its own label or its group's label matches, so "last" lists both modified sorts.
  const groups = SORT_GROUPS.map((group) => ({
    ...group,
    options: group.options.filter(({ label }) =>
      [label, group.label].some((text) => text.toLowerCase().includes(search.needle))
    ),
  })).filter((group) => group.options.length);

  // One sort at a time: Radix reports an unchecked click on the active option, which keeps it.
  const choose = (value, checked) => {
    if (checked) onSortChange(value);
  };

  // Does nothing when there is nothing to reset: a sort change also resets the page and the row selection.
  const reset = () => {
    search.setQuery('');
    if (sort !== DEFAULT_SORT) onSortChange(DEFAULT_SORT);
  };

  const header = <MenuSearchHeader search={search} placeholder="Sort by" actionLabel="Reset" onAction={reset} />;

  const sections = [
    { id: 'search', content: header },
    ...groups.map((group, index) => ({
      id: group.id,
      // The header draws the divider above the first group.
      separator: index > 0,
      label: group.label,
      items: group.options.map(({ value, label }) => ({
        id: value,
        type: 'checkbox',
        label,
        checked: sort === value,
        onPointerMove: search.keepInputFocus,
        onPointerLeave: search.keepInputFocus,
        onCheckedChange: (checked) => choose(value, checked),
      })),
    })),
  ];

  return (
    <DropdownMenu
      compact
      align="end"
      classes={SEARCHABLE_MENU_CLASSES}
      onOpenChange={(open) => !open && search.setQuery('')}
      sections={groups.length ? sections : [sections[0], { id: 'empty', separator: false, content: <NoResults /> }]}
      trigger={
        <IconTrigger label="Sort">
          <ArrowDownWideNarrow size={ICON_SIZE} className={ICON_CLASS} />
        </IconTrigger>
      }
    />
  );
}

// The filters in force, shown beside the filter button so they are visible with the menu closed. Source is the only
// filter, and "all sources" is the same as no filter, so nothing shows then.
function AppliedFilters({ source, onSourceChange }) {
  if (source.length === CONSTANT_SOURCES.length) return null;

  // An empty selection would mean "all sources", so removing the last chip clears the filter.
  const remove = (value) => {
    const next = source.filter((entry) => entry !== value);
    onSourceChange(next.length ? next : CONSTANT_SOURCES);
  };

  return (
    // 18px + the controls' 4px gap leaves the design's 22px before whatever follows.
    <div data-testid="applied-filters" className="tw-mr-[18px] tw-flex tw-items-center tw-gap-2">
      {SOURCE_OPTIONS.filter(({ value }) => source.includes(value)).map(({ value, label }) => (
        <span
          key={value}
          className="tw-flex tw-items-center tw-gap-1 tw-rounded-default tw-bg-interactive-default tw-pl-1.5 tw-pr-[3px] tw-font-title-default tw-text-text-default"
        >
          {label}
          <button
            type="button"
            aria-label={`Remove ${label} filter`}
            onClick={() => remove(value)}
            className="tw-flex tw-cursor-pointer tw-items-center tw-justify-center tw-rounded tw-border-0 tw-bg-transparent tw-p-1 hover:tw-bg-interactive-hover"
          >
            <X size={12} className={ICON_CLASS} />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={() => onSourceChange(CONSTANT_SOURCES)}
        className="tw-cursor-pointer tw-rounded-default tw-border-0 tw-bg-transparent tw-px-2.5 tw-py-[5px] tw-font-title-default tw-text-text-accent hover:tw-bg-interactive-hover"
      >
        Clear all filters
      </button>
    </div>
  );
}

// Controls for the list view. State lives in useConstantsListQueryParams; this component only renders it.
export default function ConstantsListControls({
  showEnv,
  environments,
  environmentId,
  onEnvChange,
  sort,
  onSortChange,
  source,
  onSourceChange,
}) {
  return (
    <div className="tw-ml-auto tw-flex tw-items-center tw-gap-1">
      <AppliedFilters source={source} onSourceChange={onSourceChange} />
      {showEnv && <EnvSelect environments={environments} environmentId={environmentId} onEnvChange={onEnvChange} />}
      <FilterMenu source={source} onSourceChange={onSourceChange} />
      <SortMenu sort={sort} onSortChange={onSortChange} />
    </div>
  );
}
