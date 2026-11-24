import { cn } from '@/lib/utils';
import styles from './DataTable.module.scss';

// The selection gutter fills the table's 70px side padding (checkbox right-aligned, as in Figma), so when
// docked it also covers columns scrolling under the padding.
export const GUTTER_CLASS = 'tw-flex tw-gap-1 tw-w-[70px] tw-shrink-0 tw-justify-end tw-pr-2';

// Sticky offsets are measured from the scroller's content edge (inside its padding): the gutter docks
// across the padding, the docked column at the content edge.
export const DOCKED_GUTTER_CLASS = 'tw-sticky tw--left-[70px] tw-z-[1] tw-bg-page-weak';
export const DOCKED_COLUMN_CLASS = 'tw-sticky tw-left-0 tw-z-[1]';

// Rows inside a nested scroll box can't use `sticky`; see DataTable.module.scss.
export const OFFSET_DOCKED_GUTTER_CLASS = cn(styles.offsetDocked, 'tw-relative tw-z-[1] tw-bg-page-weak');
export const OFFSET_DOCKED_COLUMN_CLASS = cn(styles.offsetDocked, 'tw-relative tw-z-[1]');

// Figma 3352-14623: 10px edge shadow, shown only while the table is scrolled sideways.
export const DOCKED_EDGE_SHADOW_CLASS = cn(
  "after:tw-pointer-events-none after:tw-absolute after:tw-inset-y-0 after:tw-left-full after:tw-hidden after:tw-w-2.5 after:tw-content-['']",
  'after:tw-bg-gradient-to-r after:tw-from-docked-column-shadow after:tw-to-transparent',
  'group-data-[scrolled-x]/data-table:after:tw-block'
);

export const SCROLLER_CLASS = styles.scroller;

// Figma 1339-127422: a translucent row-tint bar, without the row's content, across the columns only.
export const DRAG_OVERLAY_CLASS = 'tw-ml-[70px] tw-h-10 tw-bg-interactive-hover tw-opacity-70';
