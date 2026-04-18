import { useRef, useState, useEffect } from 'react';

// Lazily created — avoids top-level instantiation (SSR / test safety)
let _observer = null;
const _callbacks = new Map();

function getObserver() {
  if (!_observer) {
    _observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        _callbacks.get(entry.target)?.(entry);
      }
    });
  }
  return _observer;
}

function observeResize(el, cb) {
  _callbacks.set(el, cb);
  getObserver().observe(el);
  return () => {
    _callbacks.delete(el);
    getObserver().unobserve(el);
  };
}

export function useTextOverflow() {
  const ref = useRef(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const check = () => setIsOverflowing(el.scrollWidth > el.clientWidth);
    check();

    return observeResize(el, check);
  }, []);

  return { ref, isOverflowing };
}
