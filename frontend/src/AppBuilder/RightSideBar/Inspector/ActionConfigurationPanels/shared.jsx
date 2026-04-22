import React from 'react';
import { SelectContent as RocketSelectContent, ComboboxContent as RocketComboboxContent } from '@/components/ui/Rocket';
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
  <div className={cn('tw-flex tw-h-8 tw-items-center tw-justify-between', className)}>
    <span data-cy={dataCy} className="tw-font-body-default tw-text-text-default">
      {label}
    </span>
    <div className="tw-w-[168px]">{children}</div>
  </div>
);
