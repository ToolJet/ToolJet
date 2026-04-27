import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  SelectContent as RocketSelectContent,
  ComboboxContent as RocketComboboxContent,
  Combobox,
  ComboboxInput,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from '@/components/ui/Rocket';
import { cn } from '@/lib/utils';

export const POPOVER_MENU_Z = 'tw-z-[1043]';

const isDarkThemeActive = () => typeof window !== 'undefined' && window.localStorage?.getItem('darkMode') === 'true';

export const SelectContent = ({ className, ...props }) => (
  <RocketSelectContent {...props} className={cn(POPOVER_MENU_Z, isDarkThemeActive() && 'dark-theme', className)} />
);

export const ComboboxContent = ({ className, ...props }) => (
  <RocketComboboxContent {...props} className={cn(POPOVER_MENU_Z, isDarkThemeActive() && 'dark-theme', className)} />
);

export const FieldRow = ({ label, dataCy, children, className }) => (
  <div className={cn('tw-flex tw-min-h-8 tw-items-start tw-justify-between', className)}>
    <span data-cy={dataCy} className="tw-flex tw-h-8 tw-items-center tw-font-body-default tw-text-text-default">
      {label}
    </span>
    <div className="tw-w-[168px]">{children}</div>
  </div>
);

// Single-select combobox over `{ name, value }` options. `value`/`onChange` work
// with the raw value (not the option object) — the helper resolves the selected
// option internally.
export const OptionCombobox = ({ options, value, onChange, placeholder }) => {
  const { t } = useTranslation();
  const selected = (options ?? []).find((o) => o.value === value) ?? null;
  return (
    <Combobox
      items={options ?? []}
      itemToStringLabel={(item) => item?.name ?? ''}
      value={selected}
      onValueChange={(item) => onChange(item?.value ?? null)}
    >
      <ComboboxInput placeholder={placeholder ?? t('globals.select', 'Select') + '...'} />
      <ComboboxContent>
        <ComboboxList>
          {(item) => (
            <ComboboxItem key={item.value} value={item}>
              {item.name}
            </ComboboxItem>
          )}
        </ComboboxList>
        <ComboboxEmpty>{t('globals.noResultsFound', 'No results found.')}</ComboboxEmpty>
      </ComboboxContent>
    </Combobox>
  );
};
