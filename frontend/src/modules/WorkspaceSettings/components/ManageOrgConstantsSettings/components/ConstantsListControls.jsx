import React, { useRef, useState } from 'react';
import { ArrowDownWideNarrow, ChevronDown, Funnel } from 'lucide-react';
import { Button, Input } from '@/components/ui/Rocket';
import DropdownMenu from '@/components/ui/Rocket/DropdownMenu';
import { CONSTANT_SOURCES } from '../hooks/useConstantsListQueryParams';

const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'name_desc', label: 'Name (Z-A)' },
  { value: 'modified_desc', label: 'Last modified (newest)' },
  { value: 'modified_asc', label: 'Last modified (oldest)' },
];

const SOURCE_OPTIONS = [
  { value: 'workspace', label: 'Workspace' },
  { value: 'env', label: '.env variables' },
];

const ICON_SIZE = 14;
// The design's rows are 30px; the shared menu default is 32px.
const MENU_CLASSES = { item: 'tw-h-[30px]' };
// Filter rows also highlight on hover: while the search input is focused they cannot take focus to show it.
// The design's "Source" label is a 30px row like the options.
const FILTER_MENU_CLASSES = {
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

function FilterMenu({ source, onSourceChange }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const needle = query.trim().toLowerCase();
  const options = SOURCE_OPTIONS.filter(({ label }) => label.toLowerCase().includes(needle));
  const allSources = source.length === CONSTANT_SOURCES.length;

  const toggle = (value, checked) => {
    const next = CONSTANT_SOURCES.filter((s) => (s === value ? checked : source.includes(s)));
    // The last checked source stays checked: an empty selection would silently fall back to all sources.
    if (next.length) onSourceChange(next);
  };

  // Radix focuses an item on hover and refocuses the menu when the pointer leaves it. Cancelling that while the
  // input has focus keeps the user typing.
  const keepInputFocus = (event) => {
    if (document.activeElement === inputRef.current) event.preventDefault();
  };

  // Does nothing when there is nothing to clear: a source change also resets the page and the row selection.
  const clearAll = () => {
    setQuery('');
    if (!allSources) onSourceChange(CONSTANT_SOURCES);
  };

  const header = (
    <div className="tw-box-border tw-flex tw-h-10 tw-items-center tw-gap-2 tw-border-0 tw-border-b tw-border-solid tw-border-border-weak tw-pr-3">
      <Input
        ref={inputRef}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        // Radix menus jump to the item matching a typed character; typed characters must stay in the input.
        // Arrow keys still pass through so the keyboard can reach the options.
        onKeyDown={(event) => event.key.length === 1 && event.stopPropagation()}
        placeholder="Filter by"
        aria-label="Filter by"
        // md:tw-text-base undoes the shadcn input base that drops to 11px on desktop; the design's field is 12px.
        className="tw-min-w-0 tw-flex-1 tw-rounded-default tw-border-0 tw-bg-transparent tw-px-2 tw-font-body-default md:tw-text-base focus-visible:tw-ring-inset"
      />
      <button
        type="button"
        onClick={clearAll}
        className="tw-shrink-0 tw-cursor-pointer tw-border-0 tw-bg-transparent tw-p-0 tw-font-body-default tw-text-text-accent"
      >
        Clear all
      </button>
    </div>
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
        onPointerMove: keepInputFocus,
        onPointerLeave: keepInputFocus,
        onCheckedChange: (checked) => toggle(value, checked),
      })),
    },
  ];

  return (
    <DropdownMenu
      compact
      align="end"
      classes={FILTER_MENU_CLASSES}
      onOpenChange={(open) => !open && setQuery('')}
      sections={
        options.length
          ? sections
          : [
              sections[0],
              {
                id: 'empty',
                separator: false,
                content: <p className="tw-m-0 tw-p-4 tw-font-body-default tw-text-text-placeholder">No results</p>,
              },
            ]
      }
      trigger={
        <Button variant="ghost" size="medium" iconOnly aria-label="Filter">
          <Funnel size={ICON_SIZE} />
        </Button>
      }
    />
  );
}

function SortMenu({ sort, onSortChange }) {
  return (
    <DropdownMenu
      compact
      align="end"
      classes={MENU_CLASSES}
      sections={[{ id: 'sort', type: 'radio', value: sort, onValueChange: onSortChange, items: SORT_OPTIONS }]}
      trigger={
        <Button variant="ghost" size="medium" iconOnly aria-label="Sort">
          <ArrowDownWideNarrow size={ICON_SIZE} />
        </Button>
      }
    />
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
      {showEnv && <EnvSelect environments={environments} environmentId={environmentId} onEnvChange={onEnvChange} />}
      <FilterMenu source={source} onSourceChange={onSourceChange} />
      <SortMenu sort={sort} onSortChange={onSortChange} />
    </div>
  );
}
