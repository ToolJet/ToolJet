import React, { useEffect, useState } from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { ChevronDown, Ellipsis } from 'lucide-react';
import { useExposed, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { Button, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { lookVars, whenSet } from '@/AppBuilder/Widgets/Ui2/_shared/looks/shadcnLook';
import { isSet } from '@/AppBuilder/Widgets/Ui2/_shared/looks/kanbanLook';
import { clickedOption, menuRows, unwrap } from '@/AppBuilder/Widgets/Ui2/_actions/actionsModel';
import {
  Icon,
  MenuContent,
  MenuRows,
  MenuSeparator,
  SIZES,
  useLive,
} from '@/AppBuilder/Widgets/Ui2/_actions/actionParts';

// ---- Dropdown menu -----------------------------------------------------------------------------------------------

const VARIANTS = ['default', 'secondary', 'outline', 'ghost', 'destructive', 'link'];

export const ICON_SIZE = { sm: 'h-8 w-8', default: 'h-9 w-9', lg: 'h-10 w-10' };

/** Trigger colours: each variant has its own, so a style replaces them only when set (as ShadButton). */
export const triggerLook = (styles) =>
  cn(
    whenSet(styles, 'backgroundColor', 'bg-[color:var(--lk-bg)]'),
    isSet(styles?.hoverBackgroundColor)
      ? 'hover:bg-[color:var(--lk-hover)]'
      : whenSet(styles, 'backgroundColor', 'hover:bg-[color:color-mix(in_srgb,var(--lk-bg)_88%,#000)]'),
    whenSet(styles, 'textColor', 'text-[color:var(--lk-fg)] hover:text-[color:var(--lk-fg)]'),
    whenSet(styles, 'borderColor', 'border border-[color:var(--lk-border)]'),
    whenSet(styles, 'borderRadius', 'rounded-[var(--lk-radius)]')
  );

export const ShadDropdownMenu = (props) => {
  const { properties, styles, setExposedVariable, fireEvent, setExposedVariables, componentType } = props;
  const [open, setOpen] = useState(false);
  const [last, setLast] = useState(null);
  const disabled = busy(properties);
  const live = useLive({ disabled });
  const changeOpen = (next) => {
    if (next && live.current.disabled) return;
    setOpen(next);
    setExposedVariable('isOpen', next);
    fireEvent(next ? 'onOpen' : 'onClose');
  };
  useExposed(setExposedVariables, properties, {
    isOpen: open,
    lastClickedOption: last,
    open: async () => !live.current.disabled && setOpen(true),
    close: async () => setOpen(false),
  });
  useEffect(() => {
    if (disabled && open) setOpen(false);
  }, [disabled]); // eslint-disable-line react-hooks/exhaustive-deps
  const rows = menuRows(properties.items);
  const variant = VARIANTS.includes(properties.variant) ? properties.variant : 'outline';
  const size = SIZES.includes(properties.size) ? properties.size : 'default';
  const iconOnly = properties.triggerType === 'icon';
  const label = String(unwrap(properties.label) ?? '');
  const triggerIcon = typeof properties.triggerIcon === 'string' ? properties.triggerIcon.trim() : '';
  const pick = (row) => {
    const option = clickedOption(row);
    setLast(option);
    setExposedVariable('lastClickedOption', option);
    fireEvent('onSelect');
  };
  const spinner = <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />;
  return (
    <Shell {...props}>
      <DropdownMenuPrimitive.Root open={open} onOpenChange={changeOpen} modal={false}>
        <DropdownMenuPrimitive.Trigger asChild disabled={disabled}>
          <Button
            variant={variant}
            size={iconOnly ? 'icon' : size}
            aria-label={iconOnly ? label || 'More actions' : undefined}
            title={iconOnly && label ? label : undefined}
            className={cn(
              iconOnly && ICON_SIZE[size],
              !iconOnly && properties.fullWidth === true && 'w-full justify-between',
              ['outline', 'ghost', 'secondary'].includes(variant) &&
                'data-[state=open]:bg-[color:var(--lk-hover,var(--sc-accent))]',
              triggerLook(styles)
            )}
          >
            {iconOnly ? (
              properties.loadingState ? (
                spinner
              ) : triggerIcon ? (
                <Icon name={triggerIcon} />
              ) : (
                <Ellipsis />
              )
            ) : (
              <>
                <span className="inline-flex min-w-0 items-center gap-2">
                  {properties.loadingState ? spinner : <Icon name={triggerIcon} />}
                  <span className="truncate">{label}</span>
                </span>
                {properties.showChevron !== false ? <ChevronDown className="opacity-60" /> : null}
              </>
            )}
          </Button>
        </DropdownMenuPrimitive.Trigger>
        {/* The menu opens in the pack's portal root, outside the widget: it takes the widget's style variables. */}
        <MenuContent
          align={['start', 'center', 'end'].includes(properties.align) ? properties.align : 'start'}
          side={['bottom', 'top', 'right', 'left'].includes(properties.side) ? properties.side : 'bottom'}
          className="w-[var(--lk-menu-width,auto)] min-w-[max(8rem,var(--radix-dropdown-menu-trigger-width))]"
          style={lookVars(componentType, styles)}
        >
          {properties.menuLabel ? (
            <>
              <DropdownMenuPrimitive.Label className="px-2 py-1.5 text-sm font-semibold">
                {String(properties.menuLabel)}
              </DropdownMenuPrimitive.Label>
              <MenuSeparator />
            </>
          ) : null}
          <MenuRows rows={rows} loading={properties.optionsLoadingState === true} onPick={pick} />
        </MenuContent>
      </DropdownMenuPrimitive.Root>
    </Shell>
  );
};

export default withControlState(ShadDropdownMenu);
