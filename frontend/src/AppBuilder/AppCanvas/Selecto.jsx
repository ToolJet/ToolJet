import React, { useCallback, useRef } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import Selecto from 'react-selecto';
import './selecto.scss';
import { shallow } from 'zustand/shallow';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { resolveMarqueeCanvasId, isInMarqueeCanvas, mergeMarqueeSelection } from './Utils/marqueeSelection';
import { CANVAS_HEADER_ID, CANVAS_FOOTER_ID } from './appCanvasConstants';

const EditorSelecto = () => {
  const { moduleId } = useModuleContext();
  const setSelectedComponents = useStore((state) => state.setSelectedComponents);
  const getSelectedComponents = useStore((state) => state.getSelectedComponents, shallow);
  const getComponentDefinition = useStore((state) => state.getComponentDefinition);
  const canvasStartId = useRef(null);

  const belongsToMarqueeCanvas = (id) =>
    isInMarqueeCanvas(getComponentDefinition(id, moduleId)?.component?.parent, canvasStartId.current);

  const onAreaSelectStart = (e) => {
    canvasStartId.current = resolveMarqueeCanvasId(e.inputEvent.target);
  };

  const onAreaSelection = (e) => {
    // First filter the components
    // Scoped with the same predicate onAreaSelectionEnd uses,
    // so the live highlight always matches what actually ends up selected on release.
    const filteredIds = e.added.map((el) => el.getAttribute('widgetid')).filter(belongsToMarqueeCanvas);

    // Then apply the 'active-target' class only to the filtered components
    e.added.forEach((el) => {
      if (filteredIds.includes(el.getAttribute('widgetid'))) {
        el.classList.add('active-target');
      }
    });

    e.removed.forEach((el) => {
      el.classList.remove('active-target');
    });
  };

  const onAreaSelectionEnd = useCallback(
    (e) => {
      let isMultiSelect = null;

      const selectedIds = e.added.map((el, index) => {
        const id = el.getAttribute('widgetid');
        isMultiSelect = e.inputEvent.shiftKey || (!e.isClick && index != 0);
        return id;
      });

      if (selectedIds.length > 0) {
        // Only the marquee's own hits are scoped.
        const scopedIds = selectedIds.filter(belongsToMarqueeCanvas);

        setSelectedComponents(mergeMarqueeSelection(scopedIds, getSelectedComponents(), isMultiSelect));
      }
      canvasStartId.current = null;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setSelectedComponents, getSelectedComponents]
  );

  const handleDragCondition = useCallback(
    (e) => {
      // Clear browser selection on drag
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
      }
      const target = e.inputEvent.target;
      // Condition to allow group selection using drawing of square using cursor in canvas and main subcontainer
      const isAppCanvas = target.getAttribute('component-id') === 'canvas';
      const isSubContainer = target.getAttribute('component-id') !== 'canvas' || target.getAttribute('data-parentId');
      const isShiftKeyPressed = e.inputEvent.shiftKey;
      const isPageCanvasHeaderOrFooter =
        target.getAttribute('component-id') === CANVAS_HEADER_ID ||
        target.getAttribute('component-id') === CANVAS_FOOTER_ID;
      if (isAppCanvas || (isShiftKeyPressed && isSubContainer) || isPageCanvasHeaderOrFooter) {
        return true;
      }

      // If clicked on a components, select them and return false to prevent drag
      const closest = target.closest('.moveable-box');
      if (closest && !target.classList.contains('delete-icon')) {
        const id = closest.getAttribute('widgetid');
        const isMultiSelect = e.inputEvent.shiftKey;
        if (!isMultiSelect) {
          setSelectedComponents([id]);
        } else {
          // Handles shift + click
          const selectedComponents = getSelectedComponents();

          if (!selectedComponents.includes(id)) {
            const mergedArray = [...selectedComponents, id];
            setSelectedComponents(mergedArray);
          }
        }
      }

      return false;
    },
    [setSelectedComponents, getSelectedComponents]
  );

  return (
    <>
      <Selecto
        dragContainer={'.canvas-container'}
        selectableTargets={['.moveable-box']}
        selectByClick={true}
        toggleContinueSelect={['shift']}
        onSelect={onAreaSelection}
        onSelectEnd={onAreaSelectionEnd}
        onSelectStart={onAreaSelectStart}
        dragCondition={handleDragCondition}
        hitRate={0}
      />
    </>
  );
};

export default EditorSelecto;
