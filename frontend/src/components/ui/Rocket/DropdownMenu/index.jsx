import React, { Fragment } from 'react';
import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';
import { checkboxVariants } from '@/components/ui/Rocket/Checkbox/Checkbox';

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from './DropdownMenu';

const ITEM_CLASS = 'tw-h-8 tw-px-2 tw-py-1.5 tw-font-body-default';
// Hides shadcn's check-only indicator (first span) so CheckboxVisual can show the empty box too.
const SELECTABLE_ITEM_CLASS = 'tw-gap-1.5 [&>span:first-child]:tw-hidden';

// Decorative only: the menu item itself is the menuitemcheckbox/menuitemradio control, so a real
// checkbox here would add a second focus stop and toggle twice per click.
function CheckboxVisual({ checked }) {
  return (
    <span aria-hidden data-state={checked ? 'checked' : 'unchecked'} className={checkboxVariants()}>
      {checked && <Check className="tw-size-2.5 tw-stroke-[3]" />}
    </span>
  );
}

// Radix closes the menu on select; keepOpen lets users toggle several options in one go.
const preventClose = (event) => event.preventDefault();

export default function DropdownMenuComp({
  trigger,
  sections = [],
  side = 'bottom',
  align = 'start',
  open,
  onOpenChange,
  classes,
}) {
  // Content is portalled to body, outside the .dark-theme wrapper
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const nonEmptySections = sections.filter((section) => section.content || section.items?.length);

  const renderItem = (
    { id, label, icon, destructive, wrapper, render, type, checked, keepOpen, ...itemProps },
    itemIndex
  ) => {
    let itemNode;
    if (type === 'checkbox') {
      itemNode = (
        <DropdownMenuCheckboxItem
          checked={checked}
          onSelect={keepOpen ? preventClose : undefined}
          className={cn(ITEM_CLASS, SELECTABLE_ITEM_CLASS, classes?.item)}
          {...itemProps}
        >
          <CheckboxVisual checked={checked} />
          {label}
        </DropdownMenuCheckboxItem>
      );
    } else {
      const content = (
        <>
          {icon}
          {label}
        </>
      );
      itemNode = (
        <DropdownMenuItem
          destructive={destructive}
          className={cn(
            ITEM_CLASS,
            destructive ? '[&>svg]:tw-text-icon-danger' : '[&>svg]:tw-text-icon-weak',
            classes?.item
          )}
          {...itemProps}
        >
          {render ? render({ children: content }) : content}
        </DropdownMenuItem>
      );
    }

    return <Fragment key={id ?? itemIndex}>{wrapper ? wrapper(itemNode) : itemNode}</Fragment>;
  };

  const renderRadioSection = (section) => (
    <DropdownMenuRadioGroup value={section.value} onValueChange={section.onValueChange}>
      {section.items.map(({ value, label, ...itemProps }) => (
        <DropdownMenuRadioItem
          key={value}
          value={value}
          className={cn(ITEM_CLASS, SELECTABLE_ITEM_CLASS, classes?.item)}
          {...itemProps}
        >
          <CheckboxVisual checked={value === section.value} />
          {label}
        </DropdownMenuRadioItem>
      ))}
    </DropdownMenuRadioGroup>
  );

  return (
    <DropdownMenu {...(open !== undefined && { open })} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>

      <DropdownMenuContent
        side={side}
        align={align}
        className={cn(
          darkMode && 'dark-theme',
          'tw-p-0 tw-rounded-[10px] tw-border-border-weak tw-shadow-[shadow:var(--elevation-400-box-shadow)]',
          classes?.content
        )}
      >
        {nonEmptySections.map((section, sectionIndex) => (
          <Fragment key={section.id ?? sectionIndex}>
            {sectionIndex > 0 && <DropdownMenuSeparator className="tw-m-0" />}
            {section.content ? (
              section.content
            ) : (
              <DropdownMenuGroup className={cn('tw-px-2 tw-py-1', classes?.group)}>
                {section.label && (
                  <DropdownMenuLabel className="tw-px-2 tw-py-1.5 tw-font-body-small tw-font-normal tw-text-text-placeholder">
                    {section.label}
                  </DropdownMenuLabel>
                )}
                {section.type === 'radio' ? renderRadioSection(section) : section.items.map(renderItem)}
              </DropdownMenuGroup>
            )}
          </Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
