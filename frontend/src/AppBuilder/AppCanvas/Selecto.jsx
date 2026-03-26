import React, { useCallback, useRef } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import Selecto from 'react-selecto';
import './selecto.scss';
import { shallow } from 'zustand/shallow';
import { findHighestLevelofSelection } from './Grid/gridUtils';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';

const EditorSelecto = () => {
  const { moduleId } = useModuleContext();
  const setActiveRightSideBarTab = useStore((state) => state.setActiveRightSideBarTab);
  const setSelectedComponents = useStore((state) => state.setSelectedComponents);
  const getSelectedComponents = useStore((state) => state.getSelectedComponents, shallow);
  const getComponentDefinition = useStore((state) => state.getComponentDefinition);
  const canvasStartId = useRef(null);

  const filterSelectedComponentsByHighestLevel = (selectedIds) => {
    const highestLevelComponents = findHighestLevelofSelection(
      selectedIds.map((id) => {
        const component = getComponentDefinition(id, moduleId);
        return {
          ...component,
          id,
        };
      })
    );
    if (highestLevelComponents.length === 1) {
      return selectedIds.filter((id) => highestLevelComponents[0].id !== id);
    }
    return selectedIds;
  };

  const onAreaSelectStart = (e) => {
    const target = e.inputEvent.target;
    const componentId = target.getAttribute('component-id');

    // For canvas header/footer, we don't have a specific canvasStartId to track
    if (componentId === 'canvas-header' || componentId === 'canvas-footer') {
      canvasStartId.current = null;
      return;
    }

    if (componentId !== 'canvas') {
      const realCanvasEl = target.closest('.real-canvas');
      canvasStartId.current = realCanvasEl ? realCanvasEl.getAttribute('data-parentId') : null;
    } else {
      canvasStartId.current = null;
    }
  };

  const onAreaSelection = (e) => {
    // First filter the components
    const selectedIds = e.added.map((el) => el.getAttribute('widgetid'));
    const filteredIds = filterSelectedComponentsByHighestLevel(selectedIds);

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
      const realCanvasEl = e.inputEvent.target.closest('.real-canvas');
      const canvasSelectEndId = realCanvasEl ? realCanvasEl.getAttribute('data-parentId') : null;
      const isCanvasSelectStartEndSame = canvasStartId.current === canvasSelectEndId;
      let isMultiSelect = null;
      let selectedIds = e.added.map((el, index) => {
        const id = el.getAttribute('widgetid');
        isMultiSelect = e.inputEvent.shiftKey || (!e.isClick && index != 0);
        return id;
      });

      // Adding this to include partially selected components as well
      const partiallySelectedIds = e.beforeSelected
        .filter((el) => !e.selected.includes(el))
        .map((el) => el.getAttribute('widgetid'));
      const allSelectedIds = [...selectedIds, ...partiallySelectedIds];

      if (allSelectedIds.length > 0) {
        const newSelection = isMultiSelect
          ? [...getSelectedComponents().filter((id) => !allSelectedIds.includes(id)), ...allSelectedIds]
          : allSelectedIds;

        const isCanvasModal =
          getComponentDefinition(canvasStartId.current, moduleId)?.component?.component === 'Modal' ||
          getComponentDefinition(canvasStartId.current, moduleId)?.component?.component === 'ModalV2';

        const _selectedComponents = !isCanvasSelectStartEndSame
          ? newSelection
          : filterSelectedComponentsByHighestLevel(newSelection);

        if (isCanvasModal) {
          setSelectedComponents(
            _selectedComponents.filter(
              (id) => getComponentDefinition(id, moduleId)?.component?.parent === canvasStartId.current
            )
          );
        } else {
          setSelectedComponents(_selectedComponents);
        }
      }
      canvasStartId.current = null;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setSelectedComponents, setActiveRightSideBarTab, getSelectedComponents]
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
        target.getAttribute('component-id') === 'canvas-header' ||
        target.getAttribute('component-id') === 'canvas-footer';
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
    [setSelectedComponents, setActiveRightSideBarTab, getSelectedComponents]
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
