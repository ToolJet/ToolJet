import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  SelectContent as RocketSelectContent,
  SelectItem as RocketSelectItem,
  ComboboxContent as RocketComboboxContent,
  Combobox,
  ComboboxInput,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
  TruncatingText,
} from '@/components/ui/Rocket';
import { cn } from '@/lib/utils';

export const POPOVER_MENU_Z = 'tw-z-[1043]';

const isDarkThemeActive = () => typeof window !== 'undefined' && window.localStorage?.getItem('darkMode') === 'true';

export const SelectContent = ({ className, ...props }) => (
  <RocketSelectContent
    align="end"
    {...props}
    className={cn(POPOVER_MENU_Z, '!tw-w-min !tw-max-w-[268px]', isDarkThemeActive() && 'dark-theme', className)}
  />
);

export const SelectItem = ({ children, ...props }) => (
  <RocketSelectItem {...props}>
    <TruncatingText>{children}</TruncatingText>
  </RocketSelectItem>
);

export const ComboboxContent = ({ className, ...props }) => (
  <RocketComboboxContent {...props} className={cn(POPOVER_MENU_Z, isDarkThemeActive() && 'dark-theme', className)} />
);

export const FieldRow = ({ label, dataCy, children, className }) => (
  <div className={cn('tw-flex tw-min-h-8 tw-items-start tw-justify-between', className)}>
    <span data-cy={dataCy} className="tw-flex tw-h-8 tw-items-center tw-font-body-default tw-text-text-default">
      {label}
    </span>
    <div className="tw-w-[168px] tw-min-h-8 tw-flex tw-flex-col tw-justify-center">{children}</div>
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
      <ComboboxContent align="end" className="!tw-w-min !tw-max-w-[268px]">
        <ComboboxList>
          {(item) => (
            <ComboboxItem key={item.value} value={item}>
              <TruncatingText>{item.name}</TruncatingText>
            </ComboboxItem>
          )}
        </ComboboxList>
        <ComboboxEmpty>{t('globals.noResultsFound', 'No results found.')}</ComboboxEmpty>
      </ComboboxContent>
    </Combobox>
  );
};
