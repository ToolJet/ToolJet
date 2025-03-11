import React, { useCallback, useRef } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import Selecto from 'react-selecto';
import './selecto.scss';
import { RIGHT_SIDE_BAR_TAB } from '@/AppBuilder/RightSideBar/rightSidebarConstants';
import { shallow } from 'zustand/shallow';
import { findHighestLevelofSelection } from './Grid/gridUtils';

export const EditorSelecto = () => {
  const setActiveRightSideBarTab = useStore((state) => state.setActiveRightSideBarTab);
  const setSelectedComponents = useStore((state) => state.setSelectedComponents);
  const getSelectedComponents = useStore((state) => state.getSelectedComponents, shallow);
  const getComponentDefinition = useStore((state) => state.getComponentDefinition);
  const canvasStartId = useRef(null);

  const filterSelectedComponentsByHighestLevel = (selectedIds) => {
    const highestLevelComponents = findHighestLevelofSelection(
      selectedIds.map((id) => {
        const component = getComponentDefinition(id);
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
    canvasStartId.current =
      e.inputEvent.target.getAttribute('component-id') !== 'canvas'
        ? e.inputEvent.target.getAttribute('component-id')
        : null;
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
      const canvasSelectEndId = e.inputEvent.target.closest('.drag-container-parent')?.getAttribute('component-id');
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

        setSelectedComponents(
          !isCanvasSelectStartEndSame ? newSelection : filterSelectedComponentsByHighestLevel(newSelection)
        );
        if (e.isClick) {
          setActiveRightSideBarTab(RIGHT_SIDE_BAR_TAB.CONFIGURATION);
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

      if (
        target.getAttribute('component-id') === 'canvas' ||
        (target.getAttribute('component-id') && e.inputEvent.shiftKey)
      ) {
        return true;
      }

      // If clicked on a component, select it and return false to prevent drag
      const closest = target.closest('.moveable-box');
      if (closest && !target.classList.contains('delete-icon')) {
        const id = closest.getAttribute('widgetid');
        const isMultiSelect = e.inputEvent.shiftKey;
        if (!isMultiSelect) {
          setSelectedComponents([id]);
        } else {
          const selectedComponents = getSelectedComponents();
          if (!selectedComponents.includes(id)) {
            const mergedArray = [...selectedComponents, id];
            setSelectedComponents(mergedArray);
          }
        }
        setActiveRightSideBarTab(RIGHT_SIDE_BAR_TAB.CONFIGURATION);
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
