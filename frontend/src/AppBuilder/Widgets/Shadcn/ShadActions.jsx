import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { Check, ChevronDown, ChevronLeft, ChevronRight, Ellipsis, ImageOff } from 'lucide-react';
import TablerIcon from '@/_ui/Icon/TablerIcon';
import { useAutoHeight, useExposed } from '../packHooks';
import { Field, LoadingBox, Shell, Spinner, busy, useValidation, wantsSkeleton } from './Shadcn';
import { Button, Calendar, Skeleton, buttonVariants, cn, getPortalRoot } from './ui';
import { lookVars, whenSet } from './shadcnLook';
import { isSet } from './kanbanLook';
import {
  activeItemExposed,
  aspectRatio,
  calendarExposed,
  calendarSelection,
  carouselPositions,
  carouselSlides,
  clampInt,
  clickedOption,
  disabledMatchers,
  findNav,
  groupButtons,
  initialSelection,
  markersByDay,
  menuRows,
  moveIndex,
  navItems,
  selectionExposed,
  toDate,
  toggleSelection,
  unwrap,
  visiblePeriod,
  ymd,
} from './actionsModel';
import { stringify } from '../packJson';
import './shadcn.scss';

export { withControlState } from '../packHooks';

// shadcn/ui pack (experiment): the actions widgets. Configs in WidgetManager/shadcnSource.actions.js, style variables
// in looks/actions.js, pure logic in actionsModel.js.

const Icon = ({ name, className, size = 16 }) =>
  name ? (
    <span className={cn('inline-flex shrink-0 items-center justify-center', className)} aria-hidden="true">
      <TablerIcon iconName={name} style={{ width: size, height: size }} stroke={1.75} />
    </span>
  ) : null;

/** Latest values for actions: the exposed action functions are published once, so they read state through this. */
const useLive = (value) => {
  const ref = useRef(value);
  ref.current = value;
  return ref;
};

// ---- Dropdown menu primitives (shadcn new-york) --------------------------------------------------------------------

const MENU_CONTENT =
  'z-[1060] max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-[8rem] overflow-y-auto overflow-x-hidden border p-1 shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 rounded-[var(--lk-menu-radius,calc(var(--sc-radius)-2px))] border-[color:var(--lk-menu-border,var(--sc-border))] bg-[color:var(--lk-menu-bg,var(--sc-popover))] text-[color:var(--lk-item-fg,var(--sc-popover-foreground))]';

const MenuContent = React.forwardRef(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal container={getPortalRoot()}>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(MENU_CONTENT, className)}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
MenuContent.displayName = 'MenuContent';

const MENU_ITEM =
  'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50';
const ITEM_HOVER =
  'data-[highlighted]:bg-[color:var(--lk-item-hover,var(--sc-accent))] data-[highlighted]:text-[color:var(--lk-item-hover-fg,var(--sc-accent-foreground))]';
const ITEM_DESTRUCTIVE =
  'text-[color:var(--lk-destructive,var(--sc-destructive))] data-[highlighted]:bg-[color:color-mix(in_srgb,var(--lk-destructive,var(--sc-destructive))_10%,transparent)] data-[highlighted]:text-[color:var(--lk-destructive,var(--sc-destructive))]';
const MUTED = 'text-[color:var(--lk-desc,var(--sc-muted-foreground))]';

const MenuSeparator = () => (
  <DropdownMenuPrimitive.Separator className="-mx-1 my-1 h-px bg-[color:var(--lk-menu-border,var(--sc-border))]" />
);
const MenuLabel = ({ children }) => (
  <DropdownMenuPrimitive.Label className="px-2 py-1.5 text-xs font-medium text-[color:var(--lk-desc,var(--sc-muted-foreground))]">
    {children}
  </DropdownMenuPrimitive.Label>
);

/** The rows of a menu (items, group headings, separators), or skeleton rows while its options load. */
const MenuRows = ({ rows, loading, onPick, activeKey }) => {
  if (loading) {
    return (
      <div className="flex flex-col gap-1 p-1" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className={cn('h-6', i === 2 ? 'w-3/5' : 'w-full')} />
        ))}
      </div>
    );
  }
  if (!rows.length) return <div className={cn('px-2 py-1.5 text-sm', MUTED)}>No options</div>;
  return rows.map((row, i) => {
    if (row.kind === 'separator') return <MenuSeparator key={`s${i}`} />;
    if (row.kind === 'label') return <MenuLabel key={`l${i}`}>{row.label}</MenuLabel>;
    const active = activeKey !== undefined && String(row.value) === activeKey;
    return (
      <DropdownMenuPrimitive.Item
        key={`i${i}`}
        disabled={row.disabled}
        onSelect={() => onPick(row)}
        className={cn(
          MENU_ITEM,
          row.description && 'items-start',
          row.destructive ? ITEM_DESTRUCTIVE : ITEM_HOVER,
          active && 'font-medium'
        )}
      >
        {row.icon ? (
          <Icon
            name={row.icon}
            className={cn(
              row.description && 'mt-0.5',
              !row.destructive && 'text-[color:var(--lk-icon,var(--sc-muted-foreground))]'
            )}
          />
        ) : null}
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate">{row.label}</span>
          {row.description ? <span className={cn('text-xs', MUTED)}>{row.description}</span> : null}
        </span>
        {row.shortcut ? (
          <span className={cn('ml-auto pl-4 text-xs tracking-widest', MUTED)}>{row.shortcut}</span>
        ) : null}
        {active ? <Check className="ml-auto h-4 w-4" /> : null}
      </DropdownMenuPrimitive.Item>
    );
  });
};

// ---- Dropdown menu -----------------------------------------------------------------------------------------------

const VARIANTS = ['default', 'secondary', 'outline', 'ghost', 'destructive', 'link'];
const SIZES = ['sm', 'default', 'lg'];
const ICON_SIZE = { sm: 'h-8 w-8', default: 'h-9 w-9', lg: 'h-10 w-10' };

/** Trigger colours: each variant has its own, so a style replaces them only when set (as ShadButton). */
const triggerLook = (styles) =>
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

// ---- Button group ------------------------------------------------------------------------------------------------

const GROUP_MODES = ['actions', 'single', 'multiple'];
const GROUP_VARIANTS = ['outline', 'secondary', 'default', 'ghost'];
const SQUARE = { sm: 'w-8 px-0', default: 'w-9 px-0', lg: 'w-10 px-0' };
// Attached buttons: inner corners squared, one border between neighbours (outline) or a hairline divider (filled).
const ATTACHED = {
  horizontal: '[&>*:not(:first-child)]:rounded-l-none [&>*:not(:last-child)]:rounded-r-none [&>*:focus-visible]:z-10',
  vertical: '[&>*:not(:first-child)]:rounded-t-none [&>*:not(:last-child)]:rounded-b-none [&>*:focus-visible]:z-10',
};
const JOIN = {
  horizontal: {
    outline: '[&>*:not(:first-child)]:border-l-0',
    filled:
      '[&>*:not(:first-child)]:border-l [&>*:not(:first-child)]:border-solid [&>*:not(:first-child)]:border-l-[color:var(--lk-border,color-mix(in_srgb,currentColor_16%,transparent))]',
  },
  vertical: {
    outline: '[&>*:not(:first-child)]:border-t-0',
    filled:
      '[&>*:not(:first-child)]:border-t [&>*:not(:first-child)]:border-solid [&>*:not(:first-child)]:border-t-[color:var(--lk-border,color-mix(in_srgb,currentColor_16%,transparent))]',
  },
};
const SELECTED =
  'data-[state=on]:bg-[color:var(--lk-on-bg,var(--sc-primary))] data-[state=on]:text-[color:var(--lk-on-fg,var(--sc-primary-foreground))] data-[state=on]:hover:bg-[color:var(--lk-on-bg,var(--sc-primary))] data-[state=on]:hover:text-[color:var(--lk-on-fg,var(--sc-primary-foreground))] data-[state=on]:border-[color:var(--lk-on-bg,var(--sc-primary))]';
// A primary-filled group marks its selection a shade darker.
const SELECTED_ON_PRIMARY =
  'data-[state=on]:bg-[color:var(--lk-on-bg,color-mix(in_srgb,var(--sc-primary)_75%,#000))] data-[state=on]:text-[color:var(--lk-on-fg,var(--sc-primary-foreground))] data-[state=on]:hover:bg-[color:var(--lk-on-bg,color-mix(in_srgb,var(--sc-primary)_75%,#000))]';

export const ShadButtonGroup = (props) => {
  const { properties, styles, setExposedVariable, setExposedVariables, fireEvent } = props;
  const ref = useRef(null);
  useAutoHeight(props, ref);
  const mode = GROUP_MODES.includes(properties.mode) ? properties.mode : 'single';
  const buttons = groupButtons(properties.buttons);
  const keys = stringify(buttons.map((b) => String(b.value)));
  const initial = initialSelection(properties.defaultValue, mode, buttons);
  const initialKey = stringify(initial);
  const [selected, setSelected] = useState(initial);
  useEffect(() => setSelected(initial), [initialKey, mode, keys]); // eslint-disable-line react-hooks/exhaustive-deps
  const [lastClicked, setLastClicked] = useState(null);
  const live = useLive({ mode, buttons });
  const exposed = selectionExposed(selected, mode, buttons);
  const apply = (next) => {
    setSelected(next);
    setExposedVariables(selectionExposed(next, live.current.mode, live.current.buttons));
  };
  useExposed(setExposedVariables, properties, {
    ...exposed,
    lastClicked,
    setSelected: async (v) => apply(initialSelection(v, live.current.mode, live.current.buttons)),
    clear: async () => apply([]),
  });
  const check = useValidation(
    props,
    mode === 'multiple' ? exposed.values : mode === 'single' ? exposed.value : lastClicked?.value ?? '',
    () => apply([])
  );
  const variant = GROUP_VARIANTS.includes(properties.variant) ? properties.variant : 'outline';
  const size = SIZES.includes(properties.size) ? properties.size : 'default';
  const orientation = properties.orientation === 'vertical' ? 'vertical' : 'horizontal';
  const fullWidth = properties.fullWidth === true;
  const disabled = busy(properties);
  const click = (button) => {
    const info = { label: button.label, value: button.value };
    setLastClicked(info);
    setExposedVariable('lastClicked', info);
    const next = toggleSelection(selected, String(button.value), mode, properties.allowDeselect === true);
    const changed = stringify(next) !== stringify(selected);
    if (changed) apply(next);
    check.touch();
    fireEvent('onClick');
    if (changed) fireEvent('onChange');
  };
  const on = new Set(selected);
  return (
    <Shell {...props} innerRef={ref}>
      <Field
        label={properties.label}
        description={properties.description}
        error={check.error}
        required={check.required}
      >
        {buttons.length ? (
          <div className={cn('flex items-center gap-3', fullWidth && 'w-full')}>
            <div
              role="group"
              aria-label={properties.label ? String(properties.label) : 'Button group'}
              className={cn(
                'inline-flex w-fit items-stretch',
                orientation === 'vertical' ? 'flex-col' : 'flex-row',
                fullWidth && 'flex w-full',
                variant === 'outline' && 'rounded-[var(--lk-radius,calc(var(--sc-radius)-2px))] shadow-sm',
                ATTACHED[orientation],
                JOIN[orientation][variant === 'outline' ? 'outline' : variant === 'ghost' ? 'ghost' : 'filled']
              )}
            >
              {buttons.map((button) => {
                const isOn = mode !== 'actions' && on.has(String(button.value));
                const own = button.variant || variant;
                return (
                  <button
                    key={String(button.value)}
                    type="button"
                    data-state={mode === 'actions' ? undefined : isOn ? 'on' : 'off'}
                    aria-pressed={mode === 'actions' ? undefined : isOn}
                    disabled={disabled || button.disabled}
                    title={button.tooltip || (!button.label ? String(button.value) : undefined)}
                    aria-label={!button.label ? String(button.value) : undefined}
                    onClick={() => click(button)}
                    className={cn(
                      buttonVariants({ variant: own, size }),
                      'shadow-none rounded-[var(--lk-radius,calc(var(--sc-radius)-2px))]',
                      !button.label && button.icon && SQUARE[size],
                      fullWidth && 'flex-1',
                      orientation === 'vertical' && 'justify-start',
                      whenSet(styles, 'backgroundColor', 'bg-[color:var(--lk-bg)]'),
                      whenSet(styles, 'textColor', 'text-[color:var(--lk-fg)]'),
                      own === 'outline' && whenSet(styles, 'borderColor', 'border-[color:var(--lk-border)]'),
                      whenSet(styles, 'hoverBackgroundColor', 'hover:bg-[color:var(--lk-hover)]'),
                      own === 'default' ? SELECTED_ON_PRIMARY : SELECTED,
                      isOn && 'font-semibold'
                    )}
                  >
                    {button.icon ? (
                      <Icon
                        name={button.icon}
                        className={isOn ? undefined : 'text-[color:var(--lk-icon,currentColor)]'}
                      />
                    ) : null}
                    {button.label ? <span className="truncate">{button.label}</span> : null}
                  </button>
                );
              })}
            </div>
            {properties.loadingState ? <Spinner /> : null}
          </div>
        ) : (
          <p className="text-sm text-[color:var(--sc-muted-foreground)]">No buttons</p>
        )}
      </Field>
    </Shell>
  );
};

// ---- Navigation --------------------------------------------------------------------------------------------------

const NAV_HEIGHT = { sm: 'h-8', default: 'h-9', lg: 'h-10' };
const NAV_SQUARE = { sm: 'h-8 w-8', default: 'h-9 w-9', lg: 'h-10 w-10' };
const RADIUS = 'rounded-[var(--lk-radius,calc(var(--sc-radius)-2px))]';
const ITEM_BASE =
  'relative flex shrink-0 items-center gap-2 whitespace-nowrap text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[color:var(--sc-ring)] disabled:pointer-events-none disabled:opacity-50';

// Each variant's item colours: [inactive, active]. Styles override every one of them.
const NAV_LOOK = {
  vertical: {
    pills: [
      `${RADIUS} px-2 text-[color:var(--lk-fg,var(--sc-foreground))] hover:bg-[color:var(--lk-hover,var(--sc-accent))] hover:text-[color:var(--lk-active-fg,var(--sc-accent-foreground))]`,
      `${RADIUS} px-2 font-medium bg-[color:var(--lk-active-bg,var(--sc-accent))] text-[color:var(--lk-active-fg,var(--sc-accent-foreground))]`,
    ],
    underline: [
      'rounded-l-none rounded-r-[var(--lk-radius,calc(var(--sc-radius)-2px))] border-0 border-l-2 border-solid border-transparent pl-3 pr-2 text-[color:var(--lk-fg,var(--sc-muted-foreground))] hover:bg-[color:var(--lk-hover,transparent)] hover:text-[color:var(--lk-active-fg,var(--sc-foreground))]',
      'rounded-l-none rounded-r-[var(--lk-radius,calc(var(--sc-radius)-2px))] border-0 border-l-2 border-solid border-[color:var(--lk-indicator,var(--sc-primary))] pl-3 pr-2 font-medium bg-[color:var(--lk-active-bg,transparent)] text-[color:var(--lk-active-fg,var(--sc-foreground))]',
    ],
    ghost: [
      `${RADIUS} px-2 text-[color:var(--lk-fg,var(--sc-muted-foreground))] hover:bg-[color:var(--lk-hover,transparent)] hover:text-[color:var(--lk-active-fg,var(--sc-foreground))]`,
      `${RADIUS} px-2 font-semibold bg-[color:var(--lk-active-bg,transparent)] text-[color:var(--lk-active-fg,var(--sc-foreground))]`,
    ],
  },
  horizontal: {
    pills: [
      `${RADIUS} px-3 font-medium text-[color:var(--lk-fg,var(--sc-muted-foreground))] hover:bg-[color:var(--lk-hover,var(--sc-accent))] hover:text-[color:var(--lk-active-fg,var(--sc-accent-foreground))]`,
      `${RADIUS} px-3 font-medium bg-[color:var(--lk-active-bg,var(--sc-accent))] text-[color:var(--lk-active-fg,var(--sc-accent-foreground))]`,
    ],
    underline: [
      '-mb-px h-10 rounded-none border-0 border-b-2 border-solid border-transparent px-3 font-medium text-[color:var(--lk-fg,var(--sc-muted-foreground))] hover:bg-[color:var(--lk-hover,transparent)] hover:text-[color:var(--lk-active-fg,var(--sc-foreground))]',
      '-mb-px h-10 rounded-none border-0 border-b-2 border-solid border-[color:var(--lk-indicator,var(--sc-primary))] px-3 font-medium bg-[color:var(--lk-active-bg,transparent)] text-[color:var(--lk-active-fg,var(--sc-foreground))]',
    ],
    ghost: [
      `${RADIUS} px-3 font-medium text-[color:var(--lk-fg,var(--sc-muted-foreground))] hover:bg-[color:var(--lk-hover,transparent)] hover:text-[color:var(--lk-active-fg,var(--sc-foreground))]`,
      `${RADIUS} px-3 font-semibold bg-[color:var(--lk-active-bg,transparent)] text-[color:var(--lk-active-fg,var(--sc-foreground))]`,
    ],
  },
};
const BADGE =
  'inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-md px-1.5 text-xs font-medium tabular-nums bg-[color:var(--lk-badge-bg,var(--sc-muted))] text-[color:var(--lk-badge-fg,var(--sc-muted-foreground))]';
const SEPARATOR_LINE = 'bg-[color:var(--lk-sep,var(--sc-border))]';

/** One navigation item's face: icon, label, badge, and a chevron when it has children. */
const NavFace = ({ item, active, collapsed, chevron }) => (
  <>
    {item.icon ? (
      <Icon name={item.icon} className={active ? undefined : 'text-[color:var(--lk-icon,currentColor)]'} />
    ) : collapsed ? (
      <span className="text-xs font-semibold">{item.label.slice(0, 2)}</span>
    ) : null}
    {collapsed ? (
      <span className="sr-only">{item.label}</span>
    ) : (
      <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
    )}
    {item.badge ? (
      collapsed ? (
        <span
          aria-label={item.badge}
          className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[color:var(--lk-badge-bg,var(--sc-primary))]"
        />
      ) : (
        <span className={BADGE}>{item.badge}</span>
      )
    ) : null}
    {chevron}
  </>
);

export const ShadNavigation = (props) => {
  const { properties, styles, setExposedVariables, fireEvent, height, componentType } = props;
  const items = navItems(properties.items);
  const rawDefault = unwrap(properties.defaultValue);
  const initial = rawDefault === undefined || rawDefault === null ? '' : String(rawDefault);
  const [active, setActive] = useState(initial);
  useEffect(() => setActive(initial), [initial]);
  const [collapsed, setCollapsed] = useState(properties.collapsed === true);
  useEffect(() => setCollapsed(properties.collapsed === true), [properties.collapsed]);
  const [expanded, setExpanded] = useState({});
  const found = findNav(items, active);
  const parentKey = found?.parent?.key;
  useEffect(() => {
    if (parentKey) setExpanded((open) => ({ ...open, [parentKey]: true }));
  }, [parentKey]);
  useExposed(setExposedVariables, properties, {
    value: found ? found.item.value : '',
    activeItem: activeItemExposed(found),
    isCollapsed: collapsed,
    setActive: async (v) => setActive(v === undefined || v === null ? '' : String(unwrap(v))),
    setCollapsed: async (v) => setCollapsed(!(v === false || v === 'false')),
  });
  const disabled = busy(properties);
  const vertical = properties.orientation !== 'horizontal';
  const orientation = vertical ? 'vertical' : 'horizontal';
  const variant = ['pills', 'underline', 'ghost'].includes(properties.variant) ? properties.variant : 'pills';
  const size = SIZES.includes(properties.size) ? properties.size : 'default';
  const iconRail = vertical && collapsed;
  const stretch = !vertical && properties.align === 'stretch';
  const look = NAV_LOOK[orientation][variant];

  const pick = (item, parent = null) => {
    if (item.disabled || disabled) return;
    setActive(item.key);
    setExposedVariables({ value: item.value, activeItem: activeItemExposed({ item, parent }) });
    fireEvent('onSelect');
  };
  const itemClass = (isActive, extra) =>
    cn(
      ITEM_BASE,
      NAV_HEIGHT[size],
      look[isActive ? 1 : 0],
      iconRail && cn(NAV_SQUARE[size], 'justify-center px-0'),
      stretch && 'flex-1 justify-center',
      extra
    );

  if (properties.loadingState && !wantsSkeleton(properties)) {
    return (
      <Shell {...props}>
        <LoadingBox height={height} />
      </Shell>
    );
  }
  if (properties.loadingState) {
    return (
      <Shell {...props}>
        <div
          className={cn('flex gap-2', vertical ? 'flex-col' : 'items-center')}
          style={vertical ? { height } : undefined}
        >
          {[0, 1, 2, 3, 4].slice(0, vertical ? 5 : 4).map((i) => (
            <Skeleton key={i} className={cn(vertical ? 'h-8 w-full' : 'h-8 w-20', vertical && i === 4 && 'w-3/5')} />
          ))}
        </div>
      </Shell>
    );
  }

  // A parent opens its children as a dropdown in the top bar and the icon rail, as a nested list in the sidebar.
  const dropdown = (item, isActive) => (
    <DropdownMenuPrimitive.Root key={item.key} modal={false}>
      <DropdownMenuPrimitive.Trigger asChild disabled={disabled || item.disabled}>
        <button
          type="button"
          className={itemClass(isActive)}
          title={iconRail ? item.label : undefined}
          aria-current={isActive ? 'true' : undefined}
        >
          <NavFace
            item={item}
            active={isActive}
            collapsed={iconRail}
            chevron={iconRail ? null : <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />}
          />
        </button>
      </DropdownMenuPrimitive.Trigger>
      <MenuContent
        align="start"
        side={iconRail ? 'right' : 'bottom'}
        style={lookVars(componentType, styles)}
        className="[--lk-item-hover:var(--lk-hover,var(--sc-accent))]"
      >
        {iconRail ? <MenuLabel>{item.label}</MenuLabel> : null}
        <MenuRows
          rows={item.children.map((child) => ({ kind: 'item', ...child, description: '' }))}
          activeKey={found?.parent?.key === item.key ? found.item.key : undefined}
          onPick={(child) => pick(item.children.find((c) => c.key === String(child.value)) || child, item)}
        />
      </MenuContent>
    </DropdownMenuPrimitive.Root>
  );

  const rows = [];
  let group = '';
  items.forEach((item, index) => {
    if (item.separator) {
      rows.push(
        <div
          key={`sep-${index}`}
          role="separator"
          className={cn(SEPARATOR_LINE, vertical ? 'my-2 h-px w-full shrink-0' : 'mx-1 h-5 w-px shrink-0')}
        />
      );
      return;
    }
    if (item.group !== group) {
      group = item.group;
      if (vertical && !iconRail && group) {
        rows.push(
          <div
            key={`group-${index}`}
            className="flex h-8 shrink-0 items-center px-2 pt-2 text-xs font-medium text-[color:var(--lk-group,var(--sc-muted-foreground))]"
          >
            {group}
          </div>
        );
      } else if (index > 0) {
        rows.push(
          <div
            key={`group-${index}`}
            role="separator"
            className={cn(SEPARATOR_LINE, vertical ? 'my-2 h-px w-full shrink-0' : 'mx-1 h-5 w-px shrink-0')}
          />
        );
      }
    }
    const isActive = found ? found.item.key === item.key || found.parent?.key === item.key : false;
    if (item.children.length && (!vertical || iconRail)) {
      rows.push(dropdown(item, isActive));
      return;
    }
    if (item.children.length) {
      const open = !!expanded[item.key];
      const childActive = found?.parent?.key === item.key;
      rows.push(
        <div key={item.key} className="flex w-full shrink-0 flex-col">
          <button
            type="button"
            aria-expanded={open}
            disabled={disabled || item.disabled}
            onClick={() => setExpanded((e) => ({ ...e, [item.key]: !open }))}
            className={itemClass(
              false,
              childActive && 'font-medium text-[color:var(--lk-active-fg,var(--sc-foreground))]'
            )}
          >
            <NavFace
              item={item}
              active={false}
              collapsed={false}
              chevron={
                <ChevronRight
                  className={cn('h-4 w-4 shrink-0 opacity-60 transition-transform duration-200', open && 'rotate-90')}
                />
              }
            />
          </button>
          {open ? (
            <ul className="m-0 ml-3.5 mt-1 flex list-none flex-col gap-0.5 border-0 border-l border-solid border-[color:var(--lk-sep,var(--sc-border))] py-0.5 pl-2.5 pr-0">
              {item.children.map((child) => {
                const on = found?.item.key === child.key;
                return (
                  <li key={child.key}>
                    <button
                      type="button"
                      aria-current={on ? 'page' : undefined}
                      disabled={disabled || child.disabled}
                      onClick={() => pick(child, item)}
                      className={cn(
                        ITEM_BASE,
                        'h-8 w-full',
                        NAV_LOOK.vertical[variant === 'underline' ? 'pills' : variant][on ? 1 : 0]
                      )}
                    >
                      <NavFace item={child} active={on} collapsed={false} />
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      );
      return;
    }
    rows.push(
      <button
        key={item.key}
        type="button"
        aria-current={isActive ? 'page' : undefined}
        disabled={disabled || item.disabled}
        title={iconRail ? item.label : undefined}
        onClick={() => pick(item)}
        className={itemClass(isActive, vertical && !iconRail && 'w-full')}
      >
        <NavFace item={item} active={isActive} collapsed={iconRail} />
      </button>
    );
  });

  return (
    <Shell {...props}>
      <nav
        aria-label="Navigation"
        className={cn(
          'flex bg-[color:var(--lk-bg,transparent)]',
          whenSet(styles, 'backgroundColor', vertical ? 'p-2' : 'px-2'),
          vertical
            ? cn('flex-col gap-1 overflow-y-auto overflow-x-hidden', iconRail && 'items-center')
            : cn(
                'w-full items-center gap-1 overflow-x-auto overflow-y-hidden',
                variant === 'underline' &&
                  'border-0 border-b border-solid border-[color:var(--lk-sep,var(--sc-border))]',
                { center: 'justify-center', end: 'justify-end' }[properties.align]
              )
        )}
        style={vertical ? { height } : undefined}
      >
        {items.length ? (
          rows
        ) : (
          <span className="px-2 text-sm text-[color:var(--sc-muted-foreground)]">No navigation items</span>
        )}
      </nav>
    </Shell>
  );
};

// ---- Calendar ----------------------------------------------------------------------------------------------------

const MarkerContext = createContext(new Map());

const DAY_SELECTED =
  'bg-primary text-primary-foreground opacity-100 hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground';
const DAY_RANGE_MIDDLE =
  'rounded-none bg-transparent text-[color:var(--lk-fg,var(--sc-accent-foreground))] hover:bg-transparent';
const DAY_TODAY = 'bg-[color:var(--lk-today,var(--sc-accent))] text-[color:var(--sc-accent-foreground)]';

/** A day: shadcn's ghost button in the state's colours, with dots for the day's markers (labels on hover). */
const MarkedDayButton = ({ day, modifiers, className, children, ...rest }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);
  const markers = useContext(MarkerContext).get(ymd(day.date)) || [];
  const title = markers
    .map((m) => m.label)
    .filter(Boolean)
    .join(' · ');
  const selected = modifiers.selected && !modifiers.range_middle;
  return (
    <button
      ref={ref}
      {...rest}
      title={title || undefined}
      aria-label={title ? `${rest['aria-label'] ?? ''}, ${title}` : rest['aria-label']}
      className={cn(
        className,
        modifiers.outside && 'text-[color:var(--lk-muted,var(--sc-muted-foreground))] opacity-50',
        modifiers.disabled && 'text-[color:var(--lk-muted,var(--sc-muted-foreground))] opacity-50',
        !selected && !modifiers.range_middle && modifiers.today && DAY_TODAY,
        modifiers.range_middle && DAY_RANGE_MIDDLE,
        selected && DAY_SELECTED
      )}
    >
      {children}
      {markers.length ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[3px] left-1/2 flex -translate-x-1/2 gap-0.5"
        >
          {markers.slice(0, 3).map((m, i) => (
            <span
              key={i}
              className={cn(
                'h-1 w-1 rounded-full',
                selected && !m.color
                  ? 'bg-[color:var(--sc-primary-foreground)]'
                  : 'bg-[color:var(--lk-dot,var(--lk-marker,var(--sc-primary)))]'
              )}
              style={isSet(m.color) ? { '--lk-dot': m.color } : undefined}
            />
          ))}
        </span>
      ) : null}
    </button>
  );
};

const CALENDAR_MODES = ['single', 'multiple', 'range'];
const NAV_BUTTON = cn(
  buttonVariants({ variant: 'outline' }),
  'z-10 h-7 w-7 bg-transparent p-0 opacity-60 hover:opacity-100 text-[color:var(--lk-title,var(--sc-foreground))] border-[color:var(--lk-border,var(--sc-input))]'
);

export const ShadCalendar = (props) => {
  const { properties, setExposedVariables, fireEvent } = props;
  const ref = useRef(null);
  useAutoHeight(props, ref);
  const mode = CALENDAR_MODES.includes(properties.mode) ? properties.mode : 'single';
  const months = clampInt(properties.numberOfMonths, 1, 3, 1);
  const rawKey = stringify([unwrap(properties.defaultValue) ?? null, mode]);
  const initial = calendarSelection(properties.defaultValue, mode);
  const [selected, setSelected] = useState(initial);
  useEffect(() => setSelected(initial), [rawKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const firstSelected = mode === 'multiple' ? initial?.[0] : mode === 'range' ? initial?.from : initial;
  const initialMonth = toDate(properties.defaultMonth) || firstSelected || new Date();
  const monthKey = ymd(initialMonth).slice(0, 7);
  const [month, setMonth] = useState(initialMonth);
  useEffect(() => setMonth(initialMonth), [monthKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const live = useLive({ mode, selected, months });

  const publish = (next) => {
    setSelected(next);
    setExposedVariables(calendarExposed(next, live.current.mode));
  };
  const showMonth = (date, fire) => {
    if (!date) return;
    setMonth(date);
    setExposedVariables(visiblePeriod(date, live.current.months));
    if (fire) fireEvent('onMonthChange');
  };
  useExposed(setExposedVariables, properties, {
    ...calendarExposed(selected, mode),
    ...visiblePeriod(month, months),
    selectDate: async (date, endDate) => {
      const { mode: m, selected: current } = live.current;
      let next;
      if (m === 'multiple') {
        const add = calendarSelection(date, 'multiple');
        next = calendarSelection([...(current || []), ...add], 'multiple');
      } else if (m === 'range') {
        next = calendarSelection([date, endDate], 'range');
      } else {
        next = calendarSelection(date, 'single');
      }
      publish(next);
      showMonth(toDate(Array.isArray(date) ? date[0] : date), false);
    },
    clear: async () => publish(live.current.mode === 'multiple' ? [] : undefined),
    setMonth: async (date) => showMonth(toDate(date), false),
  });

  const markers = markersByDay(properties.markers);
  const fullWidth = properties.fullWidth === true;
  const disabled = busy(properties);
  const matchers = disabledMatchers(properties);
  const cell = 'h-[var(--lk-cell,2rem)] w-[var(--lk-cell,2rem)]';
  return (
    <Shell {...props} innerRef={ref}>
      <MarkerContext.Provider value={markers}>
        <Calendar
          mode={mode}
          selected={selected}
          onSelect={(next) => {
            publish(next);
            fireEvent('onSelect');
          }}
          required={mode === 'single'}
          month={month}
          onMonthChange={(next) => showMonth(next, true)}
          numberOfMonths={months}
          weekStartsOn={properties.weekStartsOn === 'monday' ? 1 : 0}
          showOutsideDays={properties.showOutsideDays !== false}
          fixedWeeks={properties.fixedWeeks === true}
          disabled={disabled ? true : matchers}
          startMonth={toDate(properties.minDate)}
          endMonth={toDate(properties.maxDate)}
          components={{ DayButton: MarkedDayButton }}
          className={cn(
            'p-3 bg-[color:var(--lk-bg,transparent)] text-[color:var(--lk-fg,var(--sc-foreground))]',
            fullWidth ? 'w-full' : 'w-fit',
            properties.showBorder !== false &&
              'rounded-[var(--lk-radius,var(--sc-radius))] border border-solid border-[color:var(--lk-border,var(--sc-border))]',
            disabled && 'opacity-60'
          )}
          classNames={{
            months: cn('relative flex flex-col gap-4 sm:flex-row', fullWidth && 'w-full'),
            month: 'flex w-full flex-col gap-4',
            caption_label: 'text-sm font-medium text-[color:var(--lk-title,var(--sc-foreground))]',
            button_previous: NAV_BUTTON,
            button_next: NAV_BUTTON,
            weekday: cn(
              'rounded-md text-[0.8rem] font-normal text-[color:var(--lk-muted,var(--sc-muted-foreground))]',
              fullWidth ? 'flex-1' : 'w-[var(--lk-cell,2rem)]'
            ),
            day: cn('relative p-0 text-center text-sm', fullWidth ? 'h-[var(--lk-cell,2.25rem)] flex-1' : cell),
            day_button: cn(
              buttonVariants({ variant: 'ghost' }),
              'relative h-full w-full rounded-md p-0 font-normal text-[color:var(--lk-fg,var(--sc-foreground))] hover:bg-[color:var(--lk-hover,var(--sc-accent))] hover:text-[color:var(--lk-fg,var(--sc-accent-foreground))]'
            ),
            range_start: 'rounded-l-md bg-[color:var(--lk-range,var(--sc-accent))]',
            range_middle: 'bg-[color:var(--lk-range,var(--sc-accent))]',
            range_end: 'rounded-r-md bg-[color:var(--lk-range,var(--sc-accent))]',
            selected: '',
            today: '',
            outside: '',
            disabled: '',
          }}
        />
      </MarkerContext.Provider>
    </Shell>
  );
};

// ---- Carousel ----------------------------------------------------------------------------------------------------

const ARROW =
  'absolute top-1/2 z-10 h-8 w-8 -translate-y-1/2 rounded-full border border-solid border-[color:var(--sc-border)] p-0 shadow-sm backdrop-blur bg-[color:var(--lk-arrow-bg,color-mix(in_srgb,var(--sc-background)_85%,transparent))] text-[color:var(--lk-arrow-fg,var(--sc-foreground))] hover:bg-[color:var(--lk-arrow-bg,var(--sc-background))] hover:text-[color:var(--lk-arrow-fg,var(--sc-foreground))] disabled:opacity-40';
const SLIDE_RADIUS = 'rounded-[var(--lk-radius,calc(var(--sc-radius)+4px))]';

export const ShadCarousel = (props) => {
  const { properties, setExposedVariable, setExposedVariables, fireEvent, height, currentMode } = props;
  const ref = useRef(null);
  useAutoHeight(props, ref);
  const slides = carouselSlides(properties.slides);
  const perView = Math.min(clampInt(properties.slidesPerView, 1, 4, 1), Math.max(1, slides.length));
  const positions = carouselPositions(slides.length, perView);
  const loop = properties.loop !== false;
  const initial = moveIndex(clampInt(properties.defaultIndex, 0, 100000, 0), positions, false);
  const [index, setIndex] = useState(initial);
  const indexRef = useRef(initial);
  useEffect(() => {
    indexRef.current = initial;
    setIndex(initial);
  }, [initial, positions]);
  const [failed, setFailed] = useState({});
  const [hovered, setHovered] = useState(false);
  const disabled = busy(properties);
  const live = useLive({ positions, loop, slides });

  const go = (to) => {
    const { positions: count, loop: wrap, slides: list } = live.current;
    const next = moveIndex(to, count, wrap);
    if (next === indexRef.current) return;
    indexRef.current = next;
    setIndex(next);
    setExposedVariables({ currentIndex: next, currentSlide: list[next] || {} });
    fireEvent('onSlideChange');
  };
  useExposed(setExposedVariables, properties, {
    currentIndex: index,
    currentSlide: slides[index] || {},
    next: async () => go(indexRef.current + 1),
    previous: async () => go(indexRef.current - 1),
    goTo: async (i) => go(clampInt(i, -100000, 100000, 0)),
  });

  const autoplay =
    properties.autoplay === true && positions > 1 && !disabled && !(properties.pauseOnHover !== false && hovered);
  const interval = clampInt(properties.interval, 1000, 600000, 5000);
  useEffect(() => {
    if (!autoplay) return undefined;
    const timer = setInterval(() => {
      const { positions: count, loop: wrap } = live.current;
      go(!wrap && indexRef.current >= count - 1 ? 0 : indexRef.current + 1);
    }, interval);
    return () => clearInterval(timer);
  }, [autoplay, interval]); // eslint-disable-line react-hooks/exhaustive-deps

  // Swipes: a horizontal drag of 40px or more moves a slide, and is not a click.
  const drag = useRef({ x: null, swiped: false });
  const ratio = aspectRatio(properties.aspectRatio);
  const fill = ratio === null;
  const caption = ['overlay', 'below', 'none'].includes(properties.captionPosition)
    ? properties.captionPosition
    : 'overlay';
  const fit = properties.imageFit === 'contain' ? 'object-contain' : 'object-cover';
  const gap = perView > 1 ? 'var(--lk-gap, 16px)' : 'var(--lk-gap, 0px)';
  const step = `((100% - (${perView} - 1) * ${gap}) / ${perView} + ${gap})`;
  const canPrev = positions > 1 && (loop || index > 0);
  const canNext = positions > 1 && (loop || index < positions - 1);

  const clickSlide = (i) => {
    if (drag.current.swiped) return;
    const slide = slides[i];
    setExposedVariable('clickedSlide', { ...slide, index: i });
    fireEvent('onSlideClick');
    if (slide?.link && currentMode !== 'edit' && typeof window !== 'undefined') {
      window.open(slide.link, '_blank', 'noopener,noreferrer');
    }
  };

  if (!slides.length) {
    return (
      <Shell {...props} innerRef={ref}>
        <div
          className={cn(
            'flex flex-col items-center justify-center gap-2 border border-dashed border-[color:var(--sc-border)] text-sm text-[color:var(--sc-muted-foreground)]',
            SLIDE_RADIUS
          )}
          style={fill ? { height } : { aspectRatio: ratio }}
        >
          <ImageOff className="h-5 w-5" />
          No slides
        </div>
      </Shell>
    );
  }

  return (
    <Shell {...props} innerRef={ref}>
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label="Carousel"
        tabIndex={0}
        className={cn(
          'relative flex flex-col outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--sc-ring)]',
          SLIDE_RADIUS
        )}
        style={fill ? { height } : undefined}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            go(indexRef.current - 1);
          } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            go(indexRef.current + 1);
          }
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, swiped: false };
        }}
        onPointerUp={(e) => {
          const start = drag.current.x;
          if (start === null || start === undefined || disabled) return;
          const dx = e.clientX - start;
          if (Math.abs(dx) >= 40) {
            drag.current.swiped = true;
            go(indexRef.current + (dx < 0 ? 1 : -1));
            setTimeout(() => (drag.current.swiped = false), 0);
          }
          drag.current.x = null;
        }}
      >
        <div className={cn('relative overflow-hidden', SLIDE_RADIUS, fill && 'min-h-0 flex-1')}>
          <div
            className="flex h-full touch-pan-y transition-transform duration-500 ease-out motion-reduce:transition-none"
            style={{ columnGap: gap, transform: `translateX(calc(-1 * ${index} * ${step}))` }}
          >
            {slides.map((slide, i) => {
              const showImage = slide.image && !failed[i];
              const visible = i >= index && i < index + perView;
              return (
                <div
                  key={i}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${i + 1} of ${slides.length}`}
                  aria-hidden={visible ? undefined : true}
                  className={cn('flex min-w-0 shrink-0 grow-0 flex-col', fill && 'h-full')}
                  style={{ flexBasis: `calc((100% - (${perView} - 1) * ${gap}) / ${perView})` }}
                >
                  <div
                    className={cn(
                      'relative overflow-hidden bg-[color:var(--lk-slide-bg,var(--sc-muted))]',
                      SLIDE_RADIUS,
                      fill && 'min-h-0 flex-1',
                      'cursor-pointer'
                    )}
                    style={fill ? undefined : { aspectRatio: ratio }}
                    onClick={() => clickSlide(i)}
                  >
                    {showImage ? (
                      <img
                        src={slide.image}
                        alt={slide.title || `Slide ${i + 1}`}
                        loading={i <= index + perView ? 'eager' : 'lazy'}
                        draggable={false}
                        onError={() => setFailed((f) => ({ ...f, [i]: true }))}
                        className={cn('absolute inset-0 h-full w-full select-none', fit)}
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-6 text-center">
                        {slide.image ? (
                          <ImageOff className="h-6 w-6 text-[color:var(--sc-muted-foreground)]" />
                        ) : (
                          <>
                            <span className="text-lg font-semibold text-[color:var(--lk-title,var(--sc-foreground))]">
                              {slide.title}
                            </span>
                            {slide.description ? (
                              <span className="max-w-md text-sm text-[color:var(--lk-desc,var(--sc-muted-foreground))]">
                                {slide.description}
                              </span>
                            ) : null}
                          </>
                        )}
                      </div>
                    )}
                    {caption === 'overlay' && showImage && (slide.title || slide.description) ? (
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-0.5 px-4 pb-3 pt-10 text-[color:var(--lk-caption-fg,#fff)] [background:var(--lk-caption-bg,linear-gradient(to_top,rgb(0_0_0/0.68),rgb(0_0_0/0)))]">
                        {slide.title ? <span className="truncate text-sm font-semibold">{slide.title}</span> : null}
                        {slide.description ? (
                          <span className="line-clamp-2 text-xs opacity-90">{slide.description}</span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  {caption === 'below' && (slide.title || slide.description) && showImage ? (
                    <div className="flex shrink-0 flex-col gap-0.5 pt-3">
                      {slide.title ? (
                        <span className="truncate text-sm font-medium text-[color:var(--lk-title,var(--sc-foreground))]">
                          {slide.title}
                        </span>
                      ) : null}
                      {slide.description ? (
                        <span className="line-clamp-2 text-sm text-[color:var(--lk-desc,var(--sc-muted-foreground))]">
                          {slide.description}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
          {properties.showArrows !== false && positions > 1 ? (
            <>
              <Button
                variant="outline"
                size="icon"
                aria-label="Previous slide"
                disabled={disabled || !canPrev}
                className={cn(ARROW, 'left-3')}
                onClick={() => go(indexRef.current - 1)}
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Next slide"
                disabled={disabled || !canNext}
                className={cn(ARROW, 'right-3')}
                onClick={() => go(indexRef.current + 1)}
              >
                <ChevronRight />
              </Button>
            </>
          ) : null}
        </div>
        {properties.showDots !== false && positions > 1 ? (
          <div className="flex h-7 shrink-0 items-center justify-center gap-1.5">
            {Array.from({ length: Math.min(positions, 30) }, (_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index ? 'true' : undefined}
                disabled={disabled}
                onClick={() => go(i)}
                className={cn(
                  'h-1.5 rounded-full border-0 p-0 transition-all',
                  i === index
                    ? 'w-4 bg-[color:var(--lk-dot-active,var(--sc-primary))]'
                    : 'w-1.5 bg-[color:var(--lk-dot,color-mix(in_srgb,var(--sc-foreground)_20%,transparent))] hover:bg-[color:var(--lk-dot-active,color-mix(in_srgb,var(--sc-foreground)_40%,transparent))]'
                )}
              />
            ))}
          </div>
        ) : null}
      </div>
    </Shell>
  );
};
