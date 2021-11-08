/* eslint-disable react-hooks/exhaustive-deps */
import { useRef, useState, useEffect, useCallback } from 'react';
import { isEmpty } from 'lodash';

const noop = () => {};
const useEscapeHandler = (handler = noop, dependencies = []) => {
  const escapeHandler = (e) => {
    if (e.code === 'Escape') {
      handler();
    }
  };
  useEffect(() => {
    isEmpty(document) ? undefined : document.addEventListener('keyup', escapeHandler);
    return () => (isEmpty(document) ? undefined : document.removeEventListener('keyup', escapeHandler));
  }, dependencies);
};
const useClickOutside = (dependencies, handler = noop) => {
  const callbackRef = useRef(handler);
  const ref = useRef(null);
  const outsideClickHandler = (e) => {
    if (callbackRef.current && ref.current && !ref.current.contains(e.target)) {
      callbackRef.current(e);
    }
  };
  // useEffect wrapper to be safe for concurrent mode
  useEffect(() => {
    callbackRef.current = handler;
  });
  useEffect(() => {
    isEmpty(document) ? undefined : document.addEventListener('click', outsideClickHandler, { capture: true });
    return () =>
      isEmpty(document) ? undefined : document.removeEventListener('click', outsideClickHandler, { capture: true });
  }, dependencies);
  return ref;
};
const role = 'dialog';
const usePopover = (defaultOpen = false) => {
  const triggerRef = useRef(null);
  const [open, setOpen] = useState(defaultOpen);
  const toggle = useCallback((e) => {
    e.stopPropagation();
    setOpen(!open);
  }, []);
  const close = useCallback(() => setOpen(false), []);
  useEscapeHandler(close, []);
  const contentRef = useClickOutside([], open ? close : undefined);
  const trigger = {
    ref: triggerRef,
    onClick: toggle,
    'aria-haspopup': role,
    'aria-expanded': open,
  };
  const content = {
    ref: contentRef,
    role,
  };
  return [open, trigger, content, setOpen];
};
export default usePopover;
