import React from 'react';
import { cn } from '../../cn';
import { Skel } from './look';

// The Skeleton looks of UI 2.0's widgets that draw their own (Ui2/<Widget>/<Widget>.tsx, the loadingState branches):
// each the widget's shape in grey blocks, with UI 2.0's sizes in px.

const range = (n: number) => Array.from({ length: Math.max(0, Math.floor(n)) }, (_, i) => i);

/** Tags: three tag-sized blocks. */
export const ChipsSkel = ({ round }: { round?: boolean }) => (
  <div className="ui2-ld-chips">
    {[56, 72, 48].map((w) => (
      <Skel key={w} className={cn('ui2-ld-chip', round && 'is-round')} style={{ width: w }} />
    ))}
  </div>
);

/** Key value: four rows of a key and its value, side by side (`inline`) or stacked. */
export const PairsSkel = ({ inline }: { inline: boolean }) => (
  <div className="ui2-ld-stack">
    {range(4).map((i) => (
      <div key={i} className={cn('ui2-ld-pair', inline && 'is-inline')}>
        <Skel className="ui2-ld-h16" style={{ width: 96 }} />
        <Skel className="ui2-ld-h16" style={{ width: 160, maxWidth: '100%' }} />
      </div>
    ))}
  </div>
);

/** Timeline: three entries of a dot, a title and a line. */
export const TimelineSkel = () => (
  <div className="ui2-ld-stack is-gap20">
    {range(3).map((i) => (
      <div key={i} className="ui2-ld-row is-top">
        <Skel className="ui2-ld-dot" />
        <div className="ui2-ld-stack is-gap8 is-grow">
          <Skel className="ui2-ld-h16" style={{ width: '50%' }} />
          <Skel className="ui2-ld-h12" style={{ width: '75%' }} />
        </div>
      </div>
    ))}
  </div>
);

/** Steps: `count` markers (2 to 6) with their labels, in a row or a column. */
export const StepsSkel = ({ count, vertical, marker }: { count: number; vertical: boolean; marker: number }) => {
  const n = Math.max(2, Math.min(6, count || 4));
  return (
    <div className={cn('ui2-ld-steps', vertical && 'is-vertical')}>
      {range(n).map((i) => (
        <div key={i} className="ui2-ld-step">
          <Skel className="ui2-ld-round" style={{ width: marker, height: marker }} />
          <Skel className="ui2-ld-h16" style={{ width: 80 }} />
        </div>
      ))}
    </div>
  );
};

/** Navigation: four items in a row, or five down a sidebar (the last shorter). */
export const NavSkel = ({ vertical }: { vertical: boolean }) => (
  <div className={cn('ui2-ld-nav', vertical && 'is-vertical')}>
    {range(vertical ? 5 : 4).map((i) => (
      <Skel key={i} className="ui2-ld-h32" style={{ width: vertical ? (i === 4 ? '60%' : '100%') : 80 }} />
    ))}
  </div>
);

/** Hero: an eyebrow, the title and the subtitle. */
export const HeroSkel = () => (
  <div className="ui2-ld-stack is-gap12 is-pad">
    <Skel className="ui2-ld-h12" style={{ width: 96 }} />
    <Skel className="ui2-ld-h32" style={{ width: '66%' }} />
    <Skel className="ui2-ld-h16" style={{ width: '50%' }} />
  </div>
);

/** Card grid: `count` cards in `columns`, each an image (when shown) over two lines; `row`: the image beside them. */
export const CardsSkel = ({
  count,
  columns,
  image,
  row,
  aspect,
}: {
  count: number;
  columns: number;
  image: boolean;
  row: boolean;
  aspect: string;
}) => (
  <div className="ui2-ld-cards" style={{ gridTemplateColumns: `repeat(${Math.max(1, columns)}, minmax(0, 1fr))` }}>
    {range(Math.max(1, count)).map((i) => (
      <div key={i} className={cn('ui2-ld-cardbox', row && 'is-row')}>
        {image ? (
          <Skel className="ui2-ld-cardimg" style={row ? { width: '38%', maxWidth: 200, minHeight: 120 } : { aspectRatio: aspect }} />
        ) : null}
        <div className="ui2-ld-stack is-gap8 is-pad16">
          <Skel className="ui2-ld-h16" style={{ width: '66%' }} />
          <Skel className="ui2-ld-h12" style={{ width: '50%' }} />
        </div>
      </div>
    ))}
  </div>
);

/** Record list: `count` rows of an avatar (when shown) beside a title and a line. */
export const RowsSkel = ({ count, avatar, avatarSize = 40, rounded }: { count: number; avatar: boolean; avatarSize?: number; rounded?: boolean }) => (
  <div className="ui2-ld-rows">
    {range(Math.max(1, count)).map((i) => (
      <div key={i} className="ui2-ld-row is-listrow">
        {avatar ? <Skel className={rounded ? 'ui2-ld-rounded' : 'ui2-ld-round'} style={{ width: avatarSize, height: avatarSize }} /> : null}
        <div className="ui2-ld-stack is-gap6 is-grow">
          <Skel className="ui2-ld-h16" style={{ width: '40%' }} />
          <Skel className="ui2-ld-h12" style={{ width: '65%' }} />
        </div>
      </div>
    ))}
  </div>
);

/** Progress list: `count` rows of a label and a figure over the bar. */
export const ProgressRowsSkel = ({ count, barHeight }: { count: number; barHeight: number }) => (
  <div className="ui2-ld-rows">
    {range(Math.max(1, count)).map((i) => (
      <div key={i} className="ui2-ld-stack is-gap8 is-py12">
        <div className="ui2-ld-row is-between">
          <Skel className="ui2-ld-h16" style={{ width: '33%' }} />
          <Skel className="ui2-ld-h16" style={{ width: '20%' }} />
        </div>
        <Skel className="ui2-ld-round" style={{ width: '100%', height: barHeight }} />
      </div>
    ))}
  </div>
);

/** Summary strip: `count` figure cells in `columns`, each a label, the figure and (when the strip has them) a caption. */
export const FiguresSkel = ({ count, columns, captions }: { count: number; columns: number; captions: boolean }) => (
  <div className="ui2-ld-figures" style={{ gridTemplateColumns: `repeat(${Math.max(1, columns)}, minmax(0, 1fr))` }}>
    {range(Math.max(1, count)).map((i) => (
      <div key={i} className="ui2-ld-stack is-gap6 is-pad16">
        <Skel className="ui2-ld-h12" style={{ width: 80 }} />
        <Skel className="ui2-ld-h24" style={{ width: 96 }} />
        {captions ? <Skel className="ui2-ld-h12" style={{ width: 64 }} /> : null}
      </div>
    ))}
  </div>
);

/** Schedule: the header row, then four resource rows with a booking each. */
export const ScheduleSkel = ({ rowHeight }: { rowHeight: number }) => (
  <div className="ui2-ld-schedule">
    <div className="ui2-ld-row is-schedhead">
      <Skel className="ui2-ld-h12" style={{ width: 80 }} />
      <Skel className="ui2-ld-h12 is-grow" />
    </div>
    {range(4).map((i) => (
      <div key={i} className="ui2-ld-row is-schedrow" style={{ height: rowHeight }}>
        <Skel className="ui2-ld-h16" style={{ width: 96, flexShrink: 0 }} />
        <Skel className="ui2-ld-h28" style={{ marginLeft: `${10 + ((i * 23) % 40)}%`, width: '18%' }} />
      </div>
    ))}
  </div>
);

/** List view: three rows of the row height. */
export const ListSkel = ({ rowHeight, gap }: { rowHeight: number; gap: number }) => (
  <div className="ui2-ld-stack" style={{ gap }}>
    {range(3).map((i) => (
      <Skel key={i} className="ui2-ld-listrow" style={{ height: rowHeight }} />
    ))}
  </div>
);

/** Tabs: the tab strip as three tab-sized blocks. */
export const TabStripSkel = () => (
  <div className="ui2-ld-tabstrip">
    <Skel className="ui2-ld-h28" style={{ width: 96 }} />
    <Skel className="ui2-ld-h28" style={{ width: 80 }} />
    <Skel className="ui2-ld-h28" style={{ width: 96 }} />
  </div>
);
