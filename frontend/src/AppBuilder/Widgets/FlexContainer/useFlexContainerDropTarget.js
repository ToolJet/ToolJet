import { useCallback, useEffect, useRef } from 'react';
import { shallow } from 'zustand/shallow';
import useStore from '@/AppBuilder/_stores/store';
import { computeFlexInsertIndex, getEffectiveFlexDirectionForFlexContainer } from './flexContainer.utils';

const getFlexContainerDropTargetId = ({ candidateId, boxList, getComponentTypeFromId }) => {
  if (!candidateId) return null;

  if (getComponentTypeFromId(candidateId) === 'FlexContainer') {
    return candidateId;
  }

  const hoveredWidget = boxList.find((box) => box.id === candidateId);
  const hoveredParentId = hoveredWidget?.component?.parent ?? null;

  if (hoveredParentId && getComponentTypeFromId(hoveredParentId) === 'FlexContainer') {
    return hoveredParentId;
  }

  return null;
};

export const useFlexContainerDropTarget = ({ boxList, moduleId }) => {
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
          boxList,
          getComponentTypeFromId,
        });

        if (!flexContainerId) {
          setFlexContainerDropTarget(null);
          return;
        }

        const direction = getEffectiveFlexDirectionForFlexContainer(getResolvedComponent, flexContainerId, moduleId);
        const index = computeFlexInsertIndex(flexContainerId, clientX, clientY, direction, excludeId);
        setFlexContainerDropTarget({ flexContainerId, index });
      });
    },
    [boxList, getComponentTypeFromId, getResolvedComponent, moduleId, setFlexContainerDropTarget]
  );

  useEffect(() => cancelFlexContainerDropTargetUpdate, [cancelFlexContainerDropTargetUpdate]);

  return {
    scheduleFlexContainerDropTargetUpdate,
    cancelFlexContainerDropTargetUpdate,
    clearFlexContainerDropTarget,
  };
};
