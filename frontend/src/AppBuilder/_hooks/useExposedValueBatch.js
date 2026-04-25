import { useRef, useEffect, useLayoutEffect } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';

/**
 * Opens an exposed-value batch before children's mount useEffects fire, then flushes
 * after they complete. Prevents N individual set() calls when child count increases.
 *
 * Usage: useExposedValueBatch(renderedRowCount) or useExposedValueBatch(componentCount)
 */
export const useExposedValueBatch = (count) => {
  const startExposedValueBatch = useStore((s) => s.startExposedValueBatch, shallow);
  const flushExposedValueBatch = useStore((s) => s.flushExposedValueBatch, shallow);
  const isExposedValueBatching = useStore((s) => s.isExposedValueBatching, shallow);
  const prevCountRef = useRef(count);

  // useLayoutEffect fires after all children's layout effects but before any useEffect —
  // the right moment to open the batch before children's mount effects write exposed values.
  useLayoutEffect(() => {
    if (count > prevCountRef.current) {
      startExposedValueBatch();
    }
  }, [count]);

  // No cleanup here — a cleanup on [count] runs AFTER the new useLayoutEffect opens the
  // batch but BEFORE newly mounted children's useEffects buffer their writes, causing a
  // premature flush that empties the batch before children can use it.
  useEffect(() => {
    if (count > prevCountRef.current) {
      prevCountRef.current = count;
      flushExposedValueBatch();
    }
  }, [count]);

  // Separate unmount-only safety: if the component is removed after startExposedValueBatch
  // but before flushExposedValueBatch fires, flush to prevent the batch staying open forever.
  useEffect(() => {
    return () => {
      if (isExposedValueBatching()) flushExposedValueBatch();
    };
  }, []);
};
