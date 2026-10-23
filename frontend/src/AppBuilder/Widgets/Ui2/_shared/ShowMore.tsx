// ToolJet UI 2.0: long lists draw their first rows and a button for the next ones. A 10,000-row binding drew every
// row and froze the page (list view, card grid, record list, schedule, Kanban column).
import React, { useEffect, useState } from 'react';
import type { ButtonHTMLAttributes } from 'react';

/** How many rows to draw: `step` at first and `step` more per press of Show more; back to `step` whenever `reset`
 *  changes (a new data binding, another page). */
export const useShownCount = (step: number, reset: unknown): [number, () => void] => {
  const [count, setCount] = useState(step);
  useEffect(() => setCount(step), [reset, step]);
  return [count, () => setCount((n) => n + step)];
};

/** The Show more button of the page sections and the schedule. */
const SHOW_MORE =
  'tw-rounded-ui2-md tw-px-3 tw-py-1.5 tw-text-ui2-sm tw-text-[color:var(--sc-muted-foreground)] tw-transition-colors hover:tw-bg-[color:var(--sc-muted)] hover:tw-text-[color:var(--sc-foreground)]';

interface ShowMoreProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'type' | 'children'> {
  /** Rows not drawn yet; no button when none. */
  remaining: number;
  step: number;
  onMore: () => void;
}

export const ShowMore = ({ remaining, step, onMore, ...rest }: ShowMoreProps) =>
  remaining > 0 ? (
    <button type="button" onClick={onMore} {...rest}>
      {`Show ${Math.min(step, remaining)} more of ${remaining}`}
    </button>
  ) : null;

/** Show more in a bar under a list, above a top border in the list's border colour. */
export const ShowMoreBar = ({ borderColor, ...props }: ShowMoreProps & { borderColor: string }) =>
  props.remaining > 0 ? (
    <div className="tw-flex tw-justify-center tw-border-t tw-py-2" style={{ borderColor }}>
      <ShowMore className={SHOW_MORE} {...props} />
    </div>
  ) : null;
