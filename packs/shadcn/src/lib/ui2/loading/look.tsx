import React, { useEffect, useRef, useState } from 'react';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { cn } from '../../cn';
import '../../../styles/ui2-loading.css';

// UI 2.0's loading looks (Ui2/_shared/loadingLook.tsx and Shell.tsx), drawn by the component itself ("loading": "own"
// in pack.json, so the host draws no overlay). Loading comes from the host (ToolJet.useControlState().loading: the
// Loading property and the setLoading action). Controls keep their place, non-interactive: a text-box control under a
// skeleton block of its own shape (FieldLoading), a check, switch or slider with a spinner beside it (InlineLoading).
// Text and media become skeletons in their own shape; the rest a spinner in the widget's box, or a skeleton block, as
// the widget's Loading look property (loadingIndicator) asks. The content stays mounted under the look (hidden and
// inert), so what was typed, picked or scrolled in it comes back as it was.

/** True while the host says the component is loading. */
export const useLoading = (): boolean => !!ToolJet.useControlState().loading;

/** UI 2.0's Loading look property (loadingIndicator: Spinner, the default, or Skeleton), with whether it is loading.
 *  `skeleton` is true only while loading with the Skeleton look; anything but 'skeleton' reads as the spinner. */
export const useLoadingLook = () => {
  const [indicator] = ToolJet.useStateEnumeration({
    name: 'loadingIndicator',
    label: 'Loading look',
    enumDefinition: ['spinner', 'skeleton'],
    enumLabels: { spinner: 'Spinner', skeleton: 'Skeleton' },
    initialValue: 'spinner',
    inspector: 'switch',
  });
  const loading = useLoading();
  return { loading, skeleton: loading && indicator === 'skeleton' };
};

// React 18 does not know `inert`, so it goes on as a plain attribute.
export const inert = (on: boolean) => (on ? ({ inert: '' } as Record<string, string>) : {});

/** UI 2.0's spinner: a 16px ring (`large`: 24px). */
export const Spinner = ({ large, className }: { large?: boolean; className?: string }) => (
  <span role="status" aria-label="Loading" className={cn('ui2-ld-spin', large && 'is-large', className)} />
);

/** A grey block (shadcn's Skeleton). */
export const Skel = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <div className={cn('ui-skeleton ui2-ld-skel', className)} style={style} aria-hidden="true" />
);

/** The height of an element, kept up to date (0 until measured). */
export const useHeight = <T extends HTMLElement>() => {
  const ref = useRef<T>(null);
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const measure = () => setHeight(el.clientHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, height] as const;
};

/** A spinner centred in the widget's box (at least 24px tall), larger in a box 80px or taller. */
export const LoadingBox = ({ className }: { className?: string }) => {
  const [ref, height] = useHeight<HTMLDivElement>();
  return (
    <div ref={ref} className={cn('ui2-ld-box', className)}>
      <Spinner large={height >= 80} />
    </div>
  );
};

/** The skeleton block at the widget's size (UI 2.0's 'block' look). */
export const BlockSkel = () => <Skel className="ui2-ld-block" />;

/** A Heading's skeleton: a 32px bar half the width. */
export const HeadingSkel = () => <Skel className="ui2-ld-heading" />;

/** A Text's skeleton: a 16px line every 28px of the box (1 to 8), the last of several shorter. */
export const TextSkel = () => {
  const [ref, height] = useHeight<HTMLDivElement>();
  const lines = Math.max(1, Math.min(8, Math.floor((height || 40) / 28)));
  return (
    <div ref={ref} className="ui2-ld-lines">
      {Array.from({ length: lines }, (_, i) => (
        <Skel key={i} className={cn('ui2-ld-line', i === lines - 1 && lines > 1 && 'is-short')} />
      ))}
    </div>
  );
};

/** One line of text (a Breadcrumb, a Link): 16px by 192px at most. */
export const LineSkel = () => <Skel className="ui2-ld-textline" />;

/** A Badge's skeleton: a 20 by 64px pill. */
export const PillSkel = () => <Skel className="ui2-ld-pill" />;

/** An Avatar's skeleton: `count` circles of `size` px (1 to 5), overlapping as an avatar group. */
export const AvatarSkel = ({ size, count }: { size: number; count: number }) => {
  const px = Math.max(16, Math.min(256, Number(size) || 32));
  return (
    <div className="ui2-ld-avatars">
      {Array.from({ length: Math.max(1, Math.min(5, count)) }, (_, i) => (
        <Skel key={i} className="ui2-ld-avatar" style={{ width: px, height: px }} />
      ))}
    </div>
  );
};

/** A Progress bar's skeleton: the label line (when it shows one) over the bar. */
export const BarSkel = ({ label }: { label?: boolean }) => (
  <div className="ui2-ld-bar">
    {label ? <Skel className="ui2-ld-bar-label" /> : null}
    <Skel className="ui2-ld-bar-track" />
  </div>
);

/** A board's skeleton: three columns of cards. */
export const ColumnsSkel = () => (
  <div className="ui2-ld-columns">
    {[0, 1, 2].map((i) => (
      <div key={i} className="ui2-ld-column">
        <Skel className="ui2-ld-column-title" />
        <Skel className="ui2-ld-card" />
        {i !== 2 ? <Skel className="ui2-ld-card" /> : null}
      </div>
    ))}
  </div>
);

/** The spinner or the skeleton block, as the Loading look asks (UI 2.0's look for a widget with no shape of its own). */
export const blockLook = (skeleton: boolean) => (skeleton ? <BlockSkel /> : <LoadingBox />);

/** The widget's content with its loading look over it. Idle the frame adds no box (display: contents); loading it
 *  takes the widget's box, the content stays mounted under the look (out of sight, inert), and comes back as it was.
 *  `look` is what to draw; `minHeight` the least height the look gets when the content has none (a list with no rows
 *  yet). `visible`: the content stays on screen (inert) under the look, for a look that only veils it (Scrim). */
export const LoadingFrame = ({
  loading,
  look,
  minHeight = 40,
  visible,
  className,
  children,
}: {
  loading: boolean;
  look: React.ReactNode;
  minHeight?: number;
  visible?: boolean;
  className?: string;
  children?: React.ReactNode;
}) => (
  <div
    className={cn('ui2-ld-frame', loading && 'is-loading', loading && visible && 'is-visible', className)}
    aria-busy={loading || undefined}
    style={loading ? { minHeight } : undefined}
  >
    <div className="ui2-ld-content" aria-hidden={loading || undefined} {...inert(loading)}>
      {children}
    </div>
    {loading ? <div className="ui2-ld-look">{look}</div> : null}
  </div>
);

/** A firm scrim with the spinner on a chip of its own, over content that stays on screen while it reloads (a Kanban
 *  board with cards: swapping it for a loading look lost a drag made while the data came back). */
export const Scrim = () => (
  <div className="ui2-ld-scrim">
    <span className="ui2-ld-scrim-chip">
      <Spinner className="is-mid" />
    </span>
  </div>
);

/** UI 2.0's 'field' look: the control keeps its place and size under a skeleton block of its own shape (the field's
 *  radius); the label and help text stay. The control stays mounted (out of sight), so what was typed and its focus
 *  survive. `grow`: the control fills the field's height (a Textarea in a fixed box). */
export const FieldLoading = ({ loading, grow, children }: { loading: boolean; grow?: boolean; children: React.ReactNode }) => (
  <div className={cn('ui2-ld-field', loading && 'is-loading', grow && 'is-grow')} aria-busy={loading || undefined}>
    <div className="ui2-ld-field-control" aria-hidden={loading || undefined} {...inert(loading)}>
      {children}
    </div>
    {loading ? <Skel className="ui2-ld-field-skel" /> : null}
  </div>
);

/** UI 2.0's looks for a control beside its spinner: 'inline' right after it, 'inline-top' after a multi-line control on
 *  its first line, 'wide' at the end of a control that spans the widget. Idle the wrappers add no box, so the control is
 *  not remounted when loading starts or ends. */
export const InlineLoading = ({
  loading,
  look = 'inline',
  children,
}: {
  loading: boolean;
  look?: 'inline' | 'inline-top' | 'wide';
  children: React.ReactNode;
}) => (
  <div className={cn('ui2-ld-inline', loading && 'is-loading', `is-${look}`)} aria-busy={loading || undefined}>
    <div className="ui2-ld-inline-control" {...inert(loading)}>
      {children}
    </div>
    {loading ? <Spinner /> : null}
  </div>
);

/** A glyph's loading look in its own place and size (an Icon's chip, a Circular progress ring): the part out of sight
 *  under a spinner centred in its box, or a skeleton of its shape (`round`: a circle). Idle it adds no box. */
export const InPlace = ({
  loading,
  skeleton,
  round,
  large,
  children,
}: {
  loading: boolean;
  skeleton: boolean;
  round?: boolean;
  large?: boolean;
  children: React.ReactNode;
}) => (
  <span className={cn('ui2-ld-inplace', loading && 'is-loading')} aria-busy={loading || undefined}>
    <span className="ui2-ld-inplace-part" aria-hidden={loading || undefined}>
      {children}
    </span>
    {loading ? (
      skeleton ? (
        <Skel className={cn('ui2-ld-inplace-look', round && 'is-round')} />
      ) : (
        <span className="ui2-ld-inplace-look ui2-ld-inplace-spin">
          <Spinner large={large} />
        </span>
      )
    ) : null}
  </span>
);

/** A part of a widget veiled while it loads with the Skeleton look (a Stat's change chip, icon, context and trend
 *  line): the part keeps its size, out of sight, under a skeleton of that size. */
export const Veil = ({ on, className, children }: { on: boolean; className?: string; children: React.ReactNode }) =>
  on && children ? (
    <span className={cn('ui2-ld-veil', className)} aria-hidden="true">
      <span className="ui2-ld-veil-part">{children}</span>
      <Skel className="ui2-ld-veil-skel" />
    </span>
  ) : (
    <>{children}</>
  );
