// The root every UI 2.0 widget renders in: theme tokens, style variables, visibility and the loading look.
import React, { createContext, useCallback, useRef } from 'react';
import { Skeleton, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { lookVars } from '@/AppBuilder/Widgets/Ui2/_shared/looks/shadcnLook';
import { GROUP_LOADING } from '@/AppBuilder/Widgets/Ui2/_shared/looks/groups';
import { LoadingBox, Spinner, wantsSkeleton } from '@/AppBuilder/Widgets/Ui2/_shared/loadingLook';
import { avatarPeople } from './people';
import type { LoadingLook, LoadingMap, Resolved } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { componentTypeDefinitionMap } from '@/AppBuilder/WidgetManager';
import { inFixedBox } from '@/AppBuilder/Widgets/Ui2/_shared/useDynamicHeight';
import './styles/shadcn.scss';

// How each widget looks while loading (the loadingState property or the setLoading action). Controls stay in place,
// non-interactive, with a spinner: 'field' inside the text box (Field draws it), 'inline' right after the control,
// 'inline-top' after a multi-line control on its first line, 'wide' at the end of a control that spans the widget.
// Text and media become skeletons in their own shape ('heading', 'text', 'line', 'pill', 'avatar', 'bar',
// 'columns'); the rest a skeleton block at the widget's size ('block', the default). 'own': the widget draws its
// loading state itself (or has none to draw). Groups in their own modules add theirs in looks/<group>.ts (LOADING).
const LOADING_LOOK: LoadingMap = {
  ShadButton: 'own',
  ShadStat: 'own',
  ShadSkeleton: 'own',
  ShadSeparator: 'own',
  ShadTable: 'own',
  ShadTabs: 'own',
  ShadListView: 'own',
  ShadInput: 'field',
  ShadTextarea: 'field',
  ShadSelect: 'field',
  ShadDatePicker: 'field',
  ShadCheckbox: 'inline',
  ShadSwitch: 'inline',
  ShadRadioGroup: 'inline-top',
  ShadSlider: 'wide',
  ShadToggleGroup: 'inline',
  ShadHeading: 'heading',
  ShadText: 'text',
  ShadBreadcrumb: 'line',
  ShadBadge: 'pill',
  ShadAvatar: 'avatar',
  ShadProgress: 'bar',
  ShadKanban: 'columns',
};

/** A control is non-interactive while it is disabled or loading. */
export const busy = (properties: Resolved): boolean => !!properties.disabledState || !!properties.loadingState;

// True for the 'field' loading look (text-box controls): Field then puts the spinner inside the box.
export const LoadingContext = createContext(false);

export const loadingSkeleton = (
  look: LoadingLook,
  { properties, height }: { properties: Resolved; height?: number }
) => {
  const h = Number(height) || 40;
  switch (look) {
    case 'heading':
      return <Skeleton className="tw-h-8 tw-w-1/2" />;
    case 'text': {
      const lines = Math.max(1, Math.min(8, Math.floor(h / 28)));
      return (
        <div className="tw-flex tw-flex-col tw-gap-2 tw-py-1">
          {Array.from({ length: lines }, (_, i) => (
            <Skeleton key={i} className={cn('tw-h-4', i === lines - 1 && lines > 1 ? 'tw-w-3/5' : 'tw-w-full')} />
          ))}
        </div>
      );
    }
    case 'line':
      return <Skeleton className="tw-h-4 tw-w-48 tw-max-w-full" />;
    case 'pill':
      return <Skeleton className="tw-h-5 tw-w-16 tw-rounded-full" />;
    case 'avatar': {
      const size = Math.max(16, Math.min(256, Number(properties.size) || 32));
      const count = avatarPeople(properties.names).length;
      return (
        <div className="tw-flex -tw-space-x-2">
          {Array.from({ length: Math.max(1, Math.min(5, count)) }, (_, i) => (
            <Skeleton
              key={i}
              className="tw-rounded-full tw-ring-2 tw-ring-[color:var(--sc-background)]"
              style={{ width: size, height: size }}
            />
          ))}
        </div>
      );
    }
    case 'bar':
      return (
        <div className="tw-flex tw-flex-col tw-gap-2">
          {properties.label || properties.showValue ? <Skeleton className="tw-h-4 tw-w-1/3" /> : null}
          <Skeleton className="tw-h-2 tw-w-full tw-rounded-full" />
        </div>
      );
    case 'columns':
      return (
        <div className="tw-grid tw-grid-cols-3 tw-gap-3" style={{ height: h }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="tw-flex tw-flex-col tw-gap-2 tw-rounded-[var(--sc-radius)] tw-bg-[color:var(--sc-muted)] tw-p-3"
            >
              <Skeleton className="tw-h-4 tw-w-1/2" />
              <Skeleton className="tw-h-16 tw-w-full" />
              {i !== 2 ? <Skeleton className="tw-h-16 tw-w-full" /> : null}
            </div>
          ))}
        </div>
      );
    default:
      return <Skeleton className="tw-w-full tw-rounded-[var(--sc-radius)]" style={{ height: h }} />;
  }
};

/** The widget's root: `.tj-shadcn` scopes the pack's Tailwind and maps shadcn's tokens to the app theme; the widget's
 *  set styles arrive as CSS variables its classes read (shadcnLook.ts). While loading it shows the widget's loading
 *  look (LOADING_LOOK). */
/** What Shell reads; widgets pass their own props (`<Shell {...props}>`), with any of these replaced. */
export interface ShellProps {
  properties: Resolved;
  styles?: Resolved;
  componentType: string;
  dataCy?: string;
  /** The widget's height in px: the size of its loading look. */
  height?: number;
  currentMode?: string;
  innerRef?: React.Ref<HTMLDivElement>;
  className?: string;
  children?: React.ReactNode;
}

/** A native Form that is disabled wraps its children in `<fieldset disabled>`. That disables native form controls but
 *  not the pack's own (a Slider thumb, Rating stars, Multiselect chips), so the widget root swallows input that would
 *  change them: every key but Tab (moving on stays possible) and every press, release or click, including in its
 *  popups (React events from a portal pass through the root; Radix Select commits a mouse choice on pointerup). A
 *  popup's own choice handler checks its owner too (usePickerPopup's guard): this is the second line. Closing an
 *  overlay the widget opened (an Image zoom's Close button and backdrop) changes nothing, so an element marked with
 *  DISMISS still takes it. */
const ALLOWED_KEYS = new Set(['Tab']);
const inDisabledFieldset = (el: HTMLElement | null) => !!el?.closest?.('fieldset[disabled]');
const DISMISS_ATTR = 'data-ui2-dismiss';
/** Spread on a control that only closes an overlay: it keeps working inside a disabled Form. */
export const DISMISS = { [DISMISS_ATTR]: '' } as const;
const dismisses = (target: EventTarget | null) => !!(target as Element | null)?.closest?.(`[${DISMISS_ATTR}]`);

/** The fixed-box policy: a widget with a Dynamic height setting, drawn in a fixed box (the editor, or Dynamic height
 *  off), keeps its content inside the box. Its root fills the box and scrolls what does not fit: drawn at its
 *  content's height, a Calendar, Card grid or Timeline in a short box painted over the widgets below it. With Dynamic
 *  height on in the viewer the box follows the content (useAutoHeight) and nothing changes. */
export const FIXED_BOX = 'tw-h-full tw-min-h-0 tw-overflow-y-auto';
export const containedInBox = ({ componentType, properties, currentMode }: ShellProps): boolean =>
  Boolean(componentTypeDefinitionMap[componentType]?.properties?.dynamicHeight) &&
  inFixedBox({ componentType, properties, currentMode });

export const Shell = (props: ShellProps) => {
  const { properties, styles, componentType, dataCy, children, innerRef, className } = props;
  const root = useRef<HTMLDivElement | null>(null);
  const setRoot = useCallback(
    (el: HTMLDivElement | null) => {
      root.current = el;
      if (typeof innerRef === 'function') innerRef(el);
      else if (innerRef) (innerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    },
    [innerRef]
  );
  const blockInput = (e: React.SyntheticEvent) => {
    if (!inDisabledFieldset(root.current)) return;
    if (e.type === 'keydown' && ALLOWED_KEYS.has((e as React.KeyboardEvent).key)) return;
    if (dismisses(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
  };
  const loading = !!properties.loadingState;
  const look: LoadingLook = LOADING_LOOK[componentType] || GROUP_LOADING[componentType] || 'block';
  let content = children;
  if (loading && ['field', 'inline', 'inline-top', 'wide'].includes(look)) {
    content = (
      <LoadingContext.Provider value={look === 'field'}>
        {look === 'field' ? (
          children
        ) : look === 'wide' ? (
          <div className="tw-flex tw-items-center tw-gap-3">
            <div className="tw-min-w-0 tw-flex-1">{children}</div>
            <Spinner />
          </div>
        ) : (
          <div
            className={cn(
              'tw-inline-flex tw-max-w-full tw-gap-3',
              look === 'inline-top' ? 'tw-items-start [&>[role=status]]:tw-mt-0.5' : 'tw-items-center'
            )}
          >
            {children}
            <Spinner />
          </div>
        )}
      </LoadingContext.Provider>
    );
  } else if (loading && look !== 'own') {
    content = wantsSkeleton(properties) ? loadingSkeleton(look, props) : <LoadingBox height={props.height} />;
  }
  return (
    <div
      ref={setRoot}
      data-cy={dataCy}
      onKeyDownCapture={blockInput}
      onPointerDownCapture={blockInput}
      onPointerUpCapture={blockInput}
      onMouseDownCapture={blockInput}
      onClickCapture={blockInput}
      aria-busy={loading || undefined}
      className={cn('tj-shadcn', containedInBox(props) && FIXED_BOX, className)}
      style={{
        width: '100%',
        display: properties.visibility === false ? 'none' : 'block',
        boxShadow: styles?.boxShadow,
        ...lookVars(componentType, styles),
      }}
    >
      {content}
    </div>
  );
};
