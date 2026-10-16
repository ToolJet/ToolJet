import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLatest } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { ANCHOR_PEEK, anchorTarget, isNearBottom, spacerHeight, type ChatRow } from './chatModel';
import type { MutableRefObject, TouchEvent, WheelEvent } from 'react';

interface ChatScrollArgs {
  /** The rows drawn, and all rows (the drawn ones are the newest). */
  rows: ChatRow[];
  allRows: ChatRow[];
  /** Set when a send or an appendHistory added the last rows. */
  appended: MutableRefObject<boolean>;
  responseLoading: boolean;
  historyLoading: boolean;
  error: string | null;
}

/** The Chat's scrolling, after shadcn's Message Scroller: the view follows new content only while the reader is at
 *  the end; a new user turn moves near the top with its reply growing below it; scrolled up, nothing moves the reader
 *  and jump() brings them back. */
export const useChatScroll = ({ rows, allRows, appended, responseLoading, historyLoading, error }: ChatScrollArgs) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const follow = useRef(true);
  const programmaticUntil = useRef(0);
  const anchorKey = useRef<string | null>(null);
  const previousKeys = useRef<string[] | null>(null);
  const [atEnd, setAtEnd] = useState(true);

  // The view's moves read only refs, so one set serves every render and the effects below can depend on them.
  const view = useMemo(() => {
    const scrollTo = (top: number, smooth: boolean) => {
      const el = viewportRef.current;
      if (!el) return;
      programmaticUntil.current = Date.now() + (smooth ? 600 : 80);
      if (typeof el.scrollTo === 'function') el.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' });
      else el.scrollTop = top;
    };

    const anchorElement = () =>
      anchorKey.current && contentRef.current
        ? Array.from(contentRef.current.querySelectorAll<HTMLElement>('[data-message-key]')).find(
            (n) => n.getAttribute('data-message-key') === anchorKey.current
          )
        : null;

    // The room under an anchored user turn: enough for the turn to sit near the top while its reply is shorter than
    // the view. Set on the element directly, so it is in place before the scroll that needs it.
    const updateSpacer = () => {
      const el = viewportRef.current;
      const content = contentRef.current;
      const spacer = spacerRef.current;
      if (!el || !content || !spacer) return;
      const anchor = anchorElement();
      const below = anchor ? content.offsetTop + content.offsetHeight - anchor.offsetTop : 0;
      // The view's bottom padding scrolls too, so it counts as room already there.
      const padding = parseFloat(window.getComputedStyle(el).paddingBottom) || 0;
      spacer.style.height = `${anchor ? spacerHeight(el.clientHeight - padding, ANCHOR_PEEK, below) : 0}px`;
    };

    const toEnd = (smooth: boolean) => {
      const el = viewportRef.current;
      if (el) scrollTo(el.scrollHeight, smooth);
    };
    return { scrollTo, anchorElement, updateSpacer, toEnd };
  }, []);
  const { scrollTo, anchorElement, updateSpacer, toEnd } = view;

  // The view moves when the rows shown change (by key) or a loading or error row comes or goes; all rows are read
  // through a ref, so a history that changed only in content does not move it.
  const rowKeys = rows.map((r) => r.key).join('\u0000');
  const latestRows = useLatest(allRows);
  useLayoutEffect(() => {
    const all = latestRows.current;
    const keys = all.map((r) => r.key);
    const target = appended.current ? anchorTarget(previousKeys.current, all) : null;
    appended.current = false;
    const replaced =
      previousKeys.current !== null &&
      !target &&
      (keys.length < previousKeys.current.length || previousKeys.current.some((k, i) => keys[i] !== k));
    previousKeys.current = keys;
    if (target) {
      anchorKey.current = target;
      follow.current = true;
      updateSpacer();
      const anchor = anchorElement();
      if (anchor) scrollTo(Math.max(0, anchor.offsetTop - ANCHOR_PEEK), true);
      return;
    }
    if (replaced) {
      anchorKey.current = null;
      follow.current = true;
    }
    updateSpacer();
    if (follow.current) toEnd(false);
  }, [
    rowKeys,
    responseLoading,
    historyLoading,
    error,
    latestRows,
    appended,
    anchorElement,
    scrollTo,
    toEnd,
    updateSpacer,
  ]);

  // Content that grows without a new row (a long reply rendering, an image loading) keeps the view at the end while
  // the reader follows, and shrinks the room under an anchored turn.
  useEffect(() => {
    const content = contentRef.current;
    if (!content || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => {
      updateSpacer();
      if (follow.current) toEnd(false);
      setAtEnd(isNearBottom(viewportRef.current));
    });
    ro.observe(content);
    if (viewportRef.current) ro.observe(viewportRef.current);
    return () => ro.disconnect();
  }, [toEnd, updateSpacer]);

  const onScroll = () => {
    const el = viewportRef.current;
    const near = isNearBottom(el);
    setAtEnd(near);
    if (near) follow.current = true;
    else if (Date.now() > programmaticUntil.current) follow.current = false;
  };
  // Scrolling up by wheel or touch releases the view at once, even during a smooth scroll the widget started.
  const release = (e: WheelEvent<HTMLDivElement> | TouchEvent<HTMLDivElement>) => {
    if (e.type === 'wheel' && 'deltaY' in e && e.deltaY >= 0) return;
    follow.current = false;
    programmaticUntil.current = 0;
  };
  const jump = () => {
    follow.current = true;
    toEnd(true);
  };

  return { viewportRef, contentRef, spacerRef, atEnd, onScroll, release, jump };
};
