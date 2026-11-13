import React, { Fragment, type PointerEvent, type ReactElement, type ReactNode } from 'react';
import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';
import { checkboxVariants } from '@/components/ui/Rocket/Checkbox/Checkbox';
import { radioGroupItemVariants } from '@/components/ui/Rocket/RadioGroup/RadioGroup';

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
function CheckboxVisual({ checked }: { checked?: boolean }) {
  return (
    <span aria-hidden data-state={checked ? 'checked' : 'unchecked'} className={checkboxVariants()}>
      {/* Coloured on the icon: the item's `[&>span]:tw-text-text-default` beats the box's own text colour. */}
      {checked && <Check className="tw-size-2.5 tw-stroke-[3] tw-text-text-on-solid" />}
    </span>
  );
}

// Single-choice rows get the round radio, so they read differently from the checkbox rows of a multi-select menu.
function RadioVisual({ checked }: { checked: boolean }) {
  return (
    <span aria-hidden data-state={checked ? 'checked' : 'unchecked'} className={radioGroupItemVariants()}>
      {checked && <span className="tw-size-1.5 tw-rounded-full tw-bg-text-on-solid" />}
    </span>
  );
}

// Radix closes the menu on select; keepOpen lets users toggle several options in one go.
const preventClose = (event: Event) => event.preventDefault();

export interface DropdownMenuItem {
  id?: string;
  label: ReactNode;
  icon?: ReactNode;
  destructive?: boolean;
  disabled?: boolean;
  /** Renders the item as its child element, for example a router link. */
  asChild?: boolean;
  onSelect?: (event: Event) => void;
  /** Renders the label and icon inside custom markup. */
  render?: (parts: { children: ReactNode }) => ReactNode;
  /** Wraps the whole item, for example in a tooltip. */
  wrapper?: (item: ReactElement) => ReactNode;
  type?: 'checkbox';
  /** How a checkbox item shows it is selected: a box (default) or an accent tick, both before the label. */
  indicator?: 'checkbox' | 'check';
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** Keeps the menu open when the item is selected. */
  keepOpen?: boolean;
  onPointerMove?: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerLeave?: (event: PointerEvent<HTMLDivElement>) => void;
  'data-cy'?: string;
}

export interface DropdownMenuRadioItem {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

interface SectionBase {
  id?: string;
  /** `false` is for a section that draws its own divider. */
  separator?: boolean;
}

export interface DropdownMenuItemsSection extends SectionBase {
  label?: ReactNode;
  type?: undefined;
  items: DropdownMenuItem[];
  content?: undefined;
}

export interface DropdownMenuRadioSection extends SectionBase {
  label?: ReactNode;
  type: 'radio';
  value: string | undefined;
  onValueChange: (value: string) => void;
  items: DropdownMenuRadioItem[];
  content?: undefined;
}

/** A section that renders its own content instead of items. */
export interface DropdownMenuContentSection extends SectionBase {
  content: ReactNode;
  items?: undefined;
  label?: undefined;
  type?: undefined;
}

export type DropdownMenuSection = DropdownMenuItemsSection | DropdownMenuRadioSection | DropdownMenuContentSection;

export interface DropdownMenuProps {
  trigger: ReactElement;
  sections?: DropdownMenuSection[];
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  compact?: boolean;
  classes?: { content?: string; item?: string; group?: string; label?: string };
}

export default function DropdownMenuComp({
  trigger,
  sections = [],
  side = 'bottom',
  align = 'start',
  open,
  onOpenChange,
  compact = false,
  classes,
}: DropdownMenuProps) {
  // Content is portalled to body, outside the .dark-theme wrapper
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const nonEmptySections = sections.filter((section) => section.content || section.items?.length);

  const renderItem = (
    {
      id,
      label,
      icon,
      destructive,
      wrapper,
      render,
      type,
      indicator = 'checkbox',
      checked,
      keepOpen,
      onCheckedChange,
      ...itemProps
    }: DropdownMenuItem,
    itemIndex: number
  ) => {
    let itemNode: ReactElement;
    if (type === 'checkbox') {
      itemNode = (
        <DropdownMenuCheckboxItem
          checked={checked}
          onSelect={keepOpen ? preventClose : undefined}
          onCheckedChange={onCheckedChange && ((next) => onCheckedChange(next === true))}
          className={cn(ITEM_CLASS, SELECTABLE_ITEM_CLASS, classes?.item)}
          {...itemProps}
        >
          {indicator === 'checkbox' && <CheckboxVisual checked={checked} />}
          {/* Keeps the slot where the box would be, so labels line up whether or not the row is selected. */}
          {indicator === 'check' && (
            <span aria-hidden className="tw-flex tw-size-4 tw-shrink-0 tw-items-center tw-justify-center">
              {checked && <Check className="tw-size-4 tw-text-icon-accent" />}
            </span>
          )}
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

  const renderRadioSection = (section: DropdownMenuRadioSection) => (
    <DropdownMenuRadioGroup value={section.value} onValueChange={section.onValueChange}>
      {section.items.map(({ value, label, ...itemProps }) => (
        <DropdownMenuRadioItem
          key={value}
          value={value}
          className={cn(ITEM_CLASS, SELECTABLE_ITEM_CLASS, classes?.item)}
          {...itemProps}
        >
          <RadioVisual checked={value === section.value} />
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
          'tw-p-0 tw-border-border-weak',
          compact
            ? 'tw-rounded-lg tw-shadow-[shadow:var(--elevation-300-box-shadow)]'
            : 'tw-rounded-large tw-shadow-[shadow:var(--elevation-400-box-shadow)]',
          classes?.content
        )}
      >
        {nonEmptySections.map((section, sectionIndex) => (
          <Fragment key={section.id ?? sectionIndex}>
            {/* `separator: false` is for a section that draws its own divider */}
            {sectionIndex > 0 && section.separator !== false && <DropdownMenuSeparator className="tw-m-0" />}
            {section.content ? (
              section.content
            ) : (
              <DropdownMenuGroup className={cn(compact ? 'tw-p-2' : 'tw-px-2 tw-py-1', classes?.group)}>
                {section.label && (
                  <DropdownMenuLabel
                    className={cn(
                      'tw-px-2 tw-py-1.5 tw-font-body-small tw-font-normal tw-text-text-placeholder',
                      classes?.label
                    )}
                  >
                    {section.label}
                  </DropdownMenuLabel>
                )}
                {section.type === 'radio' ? renderRadioSection(section) : section.items?.map(renderItem)}
              </DropdownMenuGroup>
            )}
          </Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
