import { useState, useCallback } from 'react';

export const usePopoverState = () => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [rootCloseBlockers, setRootCloseBlockers] = useState([]);

  const openPopover = useCallback((index) => {
    setActiveIndex(index);
  }, []);

  const closePopover = useCallback(() => {
    document.activeElement?.blur();
    setActiveIndex(null);
  }, []);

  const togglePopover = useCallback((index, isOpen) => {
    if (isOpen) {
      setActiveIndex(index);
    } else {
      document.activeElement?.blur();
      setActiveIndex(null);
    }
  }, []);

  const blockRootClose = useCallback((key) => {
    setRootCloseBlockers((prev) => [...prev, key]);
  }, []);

  const unblockRootClose = useCallback((key) => {
    setRootCloseBlockers((prev) => prev.filter((b) => b !== key));
  }, []);

  const setRootCloseBlocker = useCallback((key, isBlocking) => {
    if (isBlocking) {
      setRootCloseBlockers((prev) => [...prev, key]);
    } else {
      setRootCloseBlockers((prev) => prev.filter((b) => b !== key));
    }
  }, []);

  return {
    activeIndex,
    isRootCloseEnabled: rootCloseBlockers.length === 0,
    openPopover,
    closePopover,
    togglePopover,
    blockRootClose,
    unblockRootClose,
    setRootCloseBlocker,
  };
};
