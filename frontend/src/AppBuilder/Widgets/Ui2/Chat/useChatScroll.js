import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ANCHOR_PEEK, anchorTarget, isNearBottom, spacerHeight } from './chatModel';

/** The Chat's scrolling, after shadcn's Message Scroller: the view follows new content only while the reader is at
 *  the end; a new user turn moves near the top with its reply growing below it; scrolled up, nothing moves the reader
 *  and jump() brings them back. */
export const useChatScroll = ({ rows, allRows, appended, responseLoading, historyLoading, error }) => {
  const viewportRef = useRef(null);
  const contentRef = useRef(null);
  const spacerRef = useRef(null);
  const follow = useRef(true);
  const programmaticUntil = useRef(0);
  const anchorKey = useRef(null);
  const previousKeys = useRef(null);
  const [atEnd, setAtEnd] = useState(true);

  const scrollTo = (top, smooth) => {
    const el = viewportRef.current;
    if (!el) return;
    programmaticUntil.current = Date.now() + (smooth ? 600 : 80);
    if (typeof el.scrollTo === 'function') el.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' });
    else el.scrollTop = top;
  };

  const anchorElement = () =>
    anchorKey.current && contentRef.current
      ? Array.from(contentRef.current.querySelectorAll('[data-message-key]')).find(
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

  const toEnd = (smooth) => {
    const el = viewportRef.current;
    if (el) scrollTo(el.scrollHeight, smooth);
  };

  const rowKeys = rows.map((r) => r.key).join('\u0000');
  useLayoutEffect(() => {
    const keys = allRows.map((r) => r.key);
    const target = appended.current ? anchorTarget(previousKeys.current, allRows) : null;
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
  }, [rowKeys, responseLoading, historyLoading, error]); // eslint-disable-line react-hooks/exhaustive-deps

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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onScroll = () => {
    const el = viewportRef.current;
    const near = isNearBottom(el);
    setAtEnd(near);
    if (near) follow.current = true;
    else if (Date.now() > programmaticUntil.current) follow.current = false;
  };
  // Scrolling up by wheel or touch releases the view at once, even during a smooth scroll the widget started.
  const release = (e) => {
    if (e.type === 'wheel' && e.deltaY >= 0) return;
    follow.current = false;
    programmaticUntil.current = 0;
  };
  const jump = () => {
    follow.current = true;
    toEnd(true);
  };

  return { viewportRef, contentRef, spacerRef, atEnd, onScroll, release, jump };
};
