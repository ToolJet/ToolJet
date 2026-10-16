// The root every UI 2.0 widget renders in: theme tokens, style variables, visibility and the loading look.
import React, { createContext } from 'react';
import { Skeleton, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { lookVars } from '@/AppBuilder/Widgets/Ui2/_shared/looks/shadcnLook';
import { GROUP_LOADING } from '@/AppBuilder/Widgets/Ui2/_shared/looks/groups';
import { LoadingBox, Spinner, wantsSkeleton } from '@/AppBuilder/Widgets/Ui2/_shared/loadingLook';
import { avatarPeople } from './people';
import './styles/shadcn.scss';

// How each widget looks while loading (the loadingState property or the setLoading action). Controls stay in place,
// non-interactive, with a spinner: 'field' inside the text box (Field draws it), 'inline' right after the control,
// 'inline-top' after a multi-line control on its first line, 'wide' at the end of a control that spans the widget.
// Text and media become skeletons in their own shape ('heading', 'text', 'line', 'pill', 'avatar', 'bar',
// 'columns'); the rest a skeleton block at the widget's size ('block', the default). 'own': the widget draws its
// loading state itself (or has none to draw). Groups in their own modules add theirs in looks/<group>.js (LOADING).
const LOADING_LOOK = {
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
export const busy = (properties) => !!properties.disabledState || !!properties.loadingState;

// True for the 'field' loading look (text-box controls): Field then puts the spinner inside the box.
export const LoadingContext = createContext(false);

export const loadingSkeleton = (look, { properties, height }) => {
  const h = Number(height) || 40;
  switch (look) {
    case 'heading':
      return <Skeleton className="h-8 w-1/2" />;
    case 'text': {
      const lines = Math.max(1, Math.min(8, Math.floor(h / 28)));
      return (
        <div className="flex flex-col gap-2 py-1">
          {Array.from({ length: lines }, (_, i) => (
            <Skeleton key={i} className={cn('h-4', i === lines - 1 && lines > 1 ? 'w-3/5' : 'w-full')} />
          ))}
        </div>
      );
    }
    case 'line':
      return <Skeleton className="h-4 w-48 max-w-full" />;
    case 'pill':
      return <Skeleton className="h-5 w-16 rounded-full" />;
    case 'avatar': {
      const size = Math.max(16, Math.min(256, Number(properties.size) || 32));
      const count = avatarPeople(properties.names).length;
      return (
        <div className="flex -space-x-2">
          {Array.from({ length: Math.max(1, Math.min(5, count)) }, (_, i) => (
            <Skeleton
              key={i}
              className="rounded-full ring-2 ring-[color:var(--sc-background)]"
              style={{ width: size, height: size }}
            />
          ))}
        </div>
      );
    }
    case 'bar':
      return (
        <div className="flex flex-col gap-2">
          {properties.label || properties.showValue ? <Skeleton className="h-4 w-1/3" /> : null}
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      );
    case 'columns':
      return (
        <div className="grid grid-cols-3 gap-3" style={{ height: h }}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col gap-2 rounded-[var(--sc-radius)] bg-[color:var(--sc-muted)] p-3">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-16 w-full" />
              {i !== 2 ? <Skeleton className="h-16 w-full" /> : null}
            </div>
          ))}
        </div>
      );
    default:
      return <Skeleton className="w-full rounded-[var(--sc-radius)]" style={{ height: h }} />;
  }
};

/** The widget's root: `.tj-shadcn` scopes the pack's Tailwind and maps shadcn's tokens to the app theme; the widget's
 *  set styles arrive as CSS variables its classes read (shadcnLook.js). While loading it shows the widget's loading
 *  look (LOADING_LOOK). */
export const Shell = (props) => {
  const { properties, styles, componentType, dataCy, children, innerRef, className } = props;
  const loading = !!properties.loadingState;
  const look = LOADING_LOOK[componentType] || GROUP_LOADING[componentType] || 'block';
  let content = children;
  if (loading && ['field', 'inline', 'inline-top', 'wide'].includes(look)) {
    content = (
      <LoadingContext.Provider value={look === 'field'}>
        {look === 'field' ? (
          children
        ) : look === 'wide' ? (
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">{children}</div>
            <Spinner />
          </div>
        ) : (
          <div
            className={cn(
              'inline-flex max-w-full gap-3',
              look === 'inline-top' ? 'items-start [&>[role=status]]:mt-0.5' : 'items-center'
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
      ref={innerRef}
      data-cy={dataCy}
      aria-busy={loading || undefined}
      className={cn('tj-shadcn', className)}
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
