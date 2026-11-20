import { useCallback, useLayoutEffect, useState, type MutableRefObject } from 'react';

// Long tables and lists draw only the rows in view (antd's virtual Table, rc-virtual-list for the List), as ToolJet
// 1.0's Table does. Only above VIRTUAL_MIN_ROWS rows and only in a box with a height of its own: under Dynamic height
// (the host's tj-cc-fit) the page scrolls, not the widget, and with no layout (jsdom, a hidden widget) there is no
// viewport, so every row is drawn as before.
export const VIRTUAL_MIN_ROWS = 100;
const FIRST_GUESS = 400;
const MIN_BODY = 120;
const SLACK = 2;

const outerHeight = (el: Element | null) => {
  if (!(el instanceof HTMLElement)) return 0;
  const style = getComputedStyle(el);
  return el.offsetHeight + (parseFloat(style.marginTop) || 0) + (parseFloat(style.marginBottom) || 0);
};

/**
 * The height left for a virtual body inside `root`: the root's height less the parts around the body (`chrome`
 * selectors: header, title, pagination). `on` is false (draw every row) when not `wanted`, in fit mode, or with no
 * layout. Before the first measure it is on with a first guess, so a long list never draws every row first.
 */
export const useVirtualBody = (
  root: MutableRefObject<HTMLElement | null>,
  chrome: readonly string[],
  wanted: boolean
) => {
  const [size, setSize] = useState<{ height: number | null; width: number }>({ height: null, width: 0 });
  const measure = useCallback(() => {
    const el = root.current;
    if (!el || !wanted) return;
    const bounded = el.clientHeight > 0 && !el.closest('.tj-cc-fit');
    const taken = chrome.reduce((sum, selector) => sum + outerHeight(el.querySelector(selector)), 0);
    const height = bounded ? Math.max(MIN_BODY, Math.floor(el.clientHeight - taken - SLACK)) : 0;
    const width = el.clientWidth;
    setSize((s) => (s.height === height && s.width === width ? s : { height, width }));
  }, [root, chrome, wanted]);
  // After every render: the title, the pagination and the header come and go with the props and the data.
  useLayoutEffect(measure);
  useLayoutEffect(() => {
    const el = root.current;
    if (!wanted || !el || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [root, wanted, measure]);
  return { on: wanted && size.height !== 0, height: size.height || FIRST_GUESS, width: size.width };
};
