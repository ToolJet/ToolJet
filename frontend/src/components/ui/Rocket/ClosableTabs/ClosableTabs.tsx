import React, {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import TruncatedText from '@/components/ui/Rocket/Tooltip/TruncatedText';
import { Button } from '../Button/Button';

export interface ClosableTabItem {
  id: string;
  label: string;
  /** Leading 16px visual. */
  icon?: ReactNode;
  'data-cy'?: string;
}

export interface ClosableTabsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  tabs: ClosableTabItem[];
  /** The selected tab. Null when none is. */
  activeId: string | null;
  /** Which edge of the tab carries the accent line of the selected one. */
  indicator?: 'bottom' | 'top';
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  /** Accessible name of a tab's close button. */
  closeLabel?: (tab: ClosableTabItem) => string;
  scrollLeftLabel?: string;
  scrollRightLabel?: string;
}

const SCROLL_STEP = 200;
// Sub-pixel scroll positions would otherwise leave a chevron enabled at the very end.
const EDGE_TOLERANCE = 1;

function Divider() {
  return (
    <div aria-hidden className="tw-flex tw-shrink-0 tw-items-center tw-px-1">
      <div className="tw-h-5 tw-w-px tw-bg-border-weak" />
    </div>
  );
}

// Tabs that close. Each is 200px wide and shrinks to 128px before the list scrolls. While the tabs overflow, a chevron
// (with a divider) sits on each side; it is disabled when no tabs are hidden past that side. While they fit, no chevron
// shows. Fills whatever room its parent gives it, so put it in a flex row and let the other items be `shrink-0`.
const ClosableTabs = forwardRef<HTMLDivElement, ClosableTabsProps>(function ClosableTabs(
  {
    tabs,
    activeId,
    indicator = 'bottom',
    onSelect,
    onClose,
    closeLabel = (tab) => `Close ${tab.label}`,
    scrollLeftLabel = 'Scroll tabs left',
    scrollRightLabel = 'Scroll tabs right',
    className,
    ...props
  },
  ref
) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef(new Map<string, HTMLButtonElement>());
  const [view, setView] = useState({ overflowing: false, left: false, right: false });
  const overflowingRef = useRef(false);

  const measure = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const { scrollLeft, clientWidth, scrollWidth } = scroller;
    const wasOverflowing = overflowingRef.current;
    // Room the chevrons take from the list: root minus list. Overflow only ends once the tabs fit without them;
    // ending it earlier would widen the list, put the tabs back into overflow, and the chevrons would flicker.
    const slots = wasOverflowing ? (scroller.parentElement?.clientWidth ?? 0) - clientWidth : 0;
    const overflowing = wasOverflowing ? scrollWidth > clientWidth + slots : scrollWidth > clientWidth + EDGE_TOLERANCE;
    overflowingRef.current = overflowing;
    const left = overflowing && scrollLeft > EDGE_TOLERANCE;
    const right = overflowing && scrollLeft + clientWidth < scrollWidth - EDGE_TOLERANCE;
    setView((previous) =>
      previous.overflowing === overflowing && previous.left === left && previous.right === right
        ? previous
        : { overflowing, left, right }
    );
  }, []);

  useLayoutEffect(measure, [measure, tabs]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(scroller);
    return () => observer.disconnect();
  }, [measure]);

  // Bring the selected tab fully into view. Scrolls the list only, never the page. Runs again when the chevrons
  // appear or go, because they change the width of the list; a tab scrolled to before that is clipped by them.
  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    const tab = activeId ? tabRefs.current.get(activeId)?.parentElement?.parentElement : null;
    if (!scroller || !tab) return;
    if (tab.offsetLeft < scroller.scrollLeft) scroller.scrollLeft = tab.offsetLeft;
    else if (tab.offsetLeft + tab.offsetWidth > scroller.scrollLeft + scroller.clientWidth) {
      scroller.scrollLeft = tab.offsetLeft + tab.offsetWidth - scroller.clientWidth;
    }
    measure();
  }, [activeId, tabs.length, view.overflowing, measure]);

  const scrollBy = (direction: -1 | 1) =>
    scrollerRef.current?.scrollBy?.({ left: direction * SCROLL_STEP, behavior: 'smooth' });

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = tabs.length - 1;
    const target = { ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: last }[event.key];
    if (event.key === 'Delete') {
      event.preventDefault();
      onClose(tabs[index].id);
    } else if (target !== undefined) {
      event.preventDefault();
      const next = tabs[Math.min(Math.max(target, 0), last)];
      tabRefs.current.get(next.id)?.focus();
      onSelect(next.id);
    }
  };

  return (
    <div ref={ref} className={cn('tw-flex tw-min-w-0 tw-items-center tw-gap-1', className)} {...props}>
      {view.overflowing && (
        <>
          <Button
            variant="ghost"
            size="medium"
            iconOnly
            aria-label={scrollLeftLabel}
            disabled={!view.left}
            onClick={() => scrollBy(-1)}
            className="tw-shrink-0"
          >
            <ChevronLeft />
          </Button>
          <Divider />
        </>
      )}
      <div
        ref={scrollerRef}
        role="tablist"
        onScroll={measure}
        className="tw-relative tw-flex tw-h-12 tw-min-w-0 tw-overflow-x-auto tw-overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:tw-hidden"
      >
        {tabs.map((tab, index) => {
          const selected = tab.id === activeId;
          return (
            <div
              key={tab.id}
              className={cn(
                'tw-box-border tw-flex tw-h-12 tw-min-w-32 tw-max-w-[200px] tw-flex-[0_1_200px] tw-items-center tw-px-1',
                // Preflight is off: a solid border style alone gives the other sides 3px.
                'tw-border-0 tw-border-solid',
                indicator === 'top' ? 'tw-border-t-2' : 'tw-border-b-2',
                selected ? 'tw-border-border-accent-strong' : 'tw-border-transparent'
              )}
            >
              <div
                className={cn(
                  'tw-group/tab tw-flex tw-h-8 tw-min-w-0 tw-flex-1 tw-items-center tw-gap-1.5 tw-rounded-default tw-px-1',
                  'hover:tw-bg-interactive-hover',
                  // Focus: a white base with the 2px ring, and the label at full strength.
                  'has-[button:focus-visible]:tw-bg-background-surface-layer-01 has-[button:focus-visible]:tw-ring-2',
                  'has-[button:focus-visible]:tw-ring-interactive-focus-active'
                )}
              >
                <button
                  ref={(node) => {
                    if (node) tabRefs.current.set(tab.id, node);
                    else tabRefs.current.delete(tab.id);
                  }}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  tabIndex={selected || (activeId === null && index === 0) ? 0 : -1}
                  data-cy={tab['data-cy']}
                  onClick={() => onSelect(tab.id)}
                  onKeyDown={(event) => handleKeyDown(event, index)}
                  className={cn(
                    'tw-flex tw-h-full tw-min-w-0 tw-flex-1 tw-cursor-pointer tw-items-center tw-gap-1.5',
                    'tw-border-0 tw-bg-transparent tw-p-0 tw-text-left tw-outline-none tw-font-title-default',
                    selected ? 'tw-text-text-default' : 'tw-text-text-placeholder',
                    'group-has-[button:focus-visible]/tab:tw-text-text-default'
                  )}
                >
                  {tab.icon && (
                    <span
                      aria-hidden
                      className={cn(
                        'tw-flex tw-size-4 tw-shrink-0 tw-items-center tw-justify-center',
                        selected ? 'tw-text-icon-accent' : 'tw-text-icon-default'
                      )}
                    >
                      {tab.icon}
                    </span>
                  )}
                  <TruncatedText as="span" content={tab.label} className="tw-min-w-0 tw-flex-1">
                    {tab.label}
                  </TruncatedText>
                </button>
                <Button
                  variant="ghost"
                  size="small"
                  iconOnly
                  tabIndex={-1}
                  aria-label={closeLabel(tab)}
                  data-cy={tab['data-cy'] ? `${tab['data-cy']}-close` : undefined}
                  onClick={() => onClose(tab.id)}
                  className={cn(
                    'tw-shrink-0 tw-rounded-sm focus-visible:tw-opacity-100',
                    // Kept in the layout while hidden, so nothing shifts.
                    selected ? 'tw-opacity-100' : 'tw-opacity-0 group-hover/tab:tw-opacity-100'
                  )}
                >
                  <X />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      {view.overflowing && (
        <>
          <Divider />
          <Button
            variant="ghost"
            size="medium"
            iconOnly
            aria-label={scrollRightLabel}
            disabled={!view.right}
            onClick={() => scrollBy(1)}
            className="tw-shrink-0"
          >
            <ChevronRight />
          </Button>
        </>
      )}
    </div>
  );
});

export { ClosableTabs };
