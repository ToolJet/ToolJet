import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button/Button';

const COLLAPSED_LABEL = 'Search';
const motionClasses = 'tw-duration-300 tw-ease-out motion-reduce:tw-transition-none';

export default function SearchInput({ value, onChange, onClear, placeholder = COLLAPSED_LABEL, className }) {
  const [innerValue, setInnerValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const searchText = value ?? innerValue;
  const isExpanded = isFocused || !!searchText;
  // The collapsed label grows into the placeholder, so only the text after "Search" animates in
  const placeholderSuffix = placeholder.startsWith(COLLAPSED_LABEL) ? placeholder.slice(COLLAPSED_LABEL.length) : '';
  const placeholderPrefix = placeholderSuffix ? COLLAPSED_LABEL : placeholder;

  const updateSearchText = (nextValue) => {
    setInnerValue(nextValue);
    onChange?.(nextValue);
  };

  const clearSearchText = () => {
    updateSearchText('');
    onClear?.();
  };

  return (
    <div
      className={cn(
        'tw-group tw-relative tw-h-8 tw-w-full tw-rounded-md tw-transition-colors hover:tw-bg-interactive-hover',
        motionClasses,
        isExpanded && 'tw-bg-interactive-hover',
        className
      )}
    >
      <div
        aria-hidden
        className={cn(
          'tw-pointer-events-none tw-absolute tw-top-1/2 tw-flex tw-max-w-[calc(100%-2.5rem)] tw-items-center tw-gap-1.5 -tw-translate-y-1/2 tw-transition-[left,transform]',
          motionClasses,
          isExpanded ? 'tw-left-3 tw-translate-x-0' : 'tw-left-1/2 -tw-translate-x-1/2'
        )}
      >
        <Search size={16} className="tw-shrink-0 tw-text-icon-default" />
        <span
          className={cn(
            'tw-flex tw-min-w-0 tw-whitespace-nowrap tw-font-body-default tw-text-text-placeholder tw-transition-opacity',
            motionClasses,
            searchText && 'tw-opacity-0'
          )}
        >
          {placeholderPrefix}
          <span
            className={cn(
              // pre keeps the suffix's leading space, which flex items otherwise drop
              'tw-overflow-hidden tw-text-ellipsis tw-whitespace-pre tw-transition-[max-width,opacity]',
              motionClasses,
              isExpanded
                ? 'tw-max-w-xs tw-opacity-100'
                : 'tw-max-w-0 tw-opacity-0 group-hover:tw-max-w-xs group-hover:tw-opacity-100'
            )}
          >
            {placeholderSuffix}
          </span>
        </span>
      </div>

      <input
        type="text"
        value={searchText}
        aria-label={placeholder}
        onChange={(event) => updateSearchText(event.target.value)}
        onKeyDown={(event) => event.key === 'Escape' && clearSearchText()}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="tw-size-full tw-rounded-md tw-border-0 tw-bg-transparent tw-py-0 tw-pl-[2.125rem] tw-pr-9 tw-font-body-default tw-text-text-default tw-appearance-none"
        data-cy="search-input"
      />

      <Button
        variant="ghost"
        size="small"
        iconOnly
        aria-label="Clear search"
        // Keep focus in the input so clearing doesn't collapse the bar
        onMouseDown={(event) => event.preventDefault()}
        onClick={clearSearchText}
        className={cn(
          'tw-absolute tw-right-3 tw-top-1/2 -tw-translate-y-1/2 tw-rounded tw-text-icon-strong tw-transition-[opacity,visibility]',
          motionClasses,
          !searchText && 'tw-invisible tw-opacity-0'
        )}
        data-cy="search-input-clear"
      >
        <X size={12} />
      </Button>
    </div>
  );
}
