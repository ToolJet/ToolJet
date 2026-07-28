import { useCallback, useEffect, useRef } from 'react';
import { shallow } from 'zustand/shallow';
import useStore from '@/AppBuilder/_stores/store';
import { computeFlexInsertIndex, getEffectiveFlexDirectionForFlexContainer } from './flexContainer.utils';

// Resolve the flex drop-target id from the candidate (always the innermost real-canvas
// parentId under the cursor). Only the innermost canvas counts: if the cursor is inside a
// descendant subcontainer, that subcontainer — not its flex parent — is the candidate, so
// the parent flex indicator is suppressed. A nested FlexContainer still resolves to itself.
const getFlexContainerDropTargetId = ({ candidateId, getComponentTypeFromId }) => {
  if (!candidateId) return null;
  return getComponentTypeFromId(candidateId) === 'FlexContainer' ? candidateId : null;
};

export const useFlexContainerDropTarget = ({ moduleId }) => {
  const rafRef = useRef(null);
  const getComponentTypeFromId = useStore((state) => state.getComponentTypeFromId, shallow);
  const getResolvedComponent = useStore((state) => state.getResolvedComponent, shallow);
  const setFlexContainerDropTarget = useStore((state) => state.setFlexContainerDropTarget, shallow);

  const cancelFlexContainerDropTargetUpdate = useCallback(() => {
    if (!rafRef.current) return;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, []);

  const clearFlexContainerDropTarget = useCallback(() => {
    setFlexContainerDropTarget(null);
  }, [setFlexContainerDropTarget]);

  const scheduleFlexContainerDropTargetUpdate = useCallback(
    ({ candidateId, clientX, clientY, excludeId = null }) => {
      if (rafRef.current) return;

      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;

        const flexContainerId = getFlexContainerDropTargetId({
          candidateId,
          getComponentTypeFromId,
        });

        const currentTarget = useStore.getState().flexContainerDropTarget;

        if (!flexContainerId) {
          // Avoid no-op store writes during non-flex drags (can fire ~60fps)
          if (currentTarget !== null) setFlexContainerDropTarget(null);
          return;
        }

        const direction = getEffectiveFlexDirectionForFlexContainer(getResolvedComponent, flexContainerId, moduleId);
        const index = computeFlexInsertIndex(flexContainerId, clientX, clientY, direction, excludeId);
        if (currentTarget?.flexContainerId !== flexContainerId || currentTarget?.index !== index) {
          setFlexContainerDropTarget({ flexContainerId, index });
        }
      });
    },
    [getComponentTypeFromId, getResolvedComponent, moduleId, setFlexContainerDropTarget]
  );

  useEffect(() => cancelFlexContainerDropTargetUpdate, [cancelFlexContainerDropTargetUpdate]);

  return {
    scheduleFlexContainerDropTargetUpdate,
    cancelFlexContainerDropTargetUpdate,
    clearFlexContainerDropTarget,
  };
};
