import React, { useCallback } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import Selecto from 'react-selecto';
import './selecto.scss';
import { RIGHT_SIDE_BAR_TAB } from '@/AppBuilder/RightSideBar/rightSidebarConstants';
import { shallow } from 'zustand/shallow';

export const EditorSelecto = () => {
  const setActiveRightSideBarTab = useStore((state) => state.setActiveRightSideBarTab);
  const setSelectedComponents = useStore((state) => state.setSelectedComponents);
  const getSelectedComponents = useStore((state) => state.getSelectedComponents, shallow);

  const onAreaSelection = useCallback((e) => {
    e.added.forEach((el) => {
      el.classList.add('active-target');
    });
    e.removed.forEach((el) => {
      el.classList.remove('active-target');
    });
  }, []);

  const onAreaSelectionEnd = useCallback(
    (e) => {
      let isMultiSelect = null;
      const selectedIds = e.selected.map((el, index) => {
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
        if (isMultiSelect) {
          // Merge new selections with existing ones, avoiding duplicates
          const newSelection = [
            ...getSelectedComponents().filter((id) => !allSelectedIds.includes(id)),
            ...allSelectedIds,
          ];
          setSelectedComponents(newSelection);
        } else {
          setSelectedComponents(allSelectedIds);
        }
        if (e.isClick) {
          setActiveRightSideBarTab(RIGHT_SIDE_BAR_TAB.CONFIGURATION);
        }
      }
    },
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
      // This condition is to ensure selection happens only on main app canvas and not on subcontainers
      if (target.getAttribute('component-id') === 'canvas') {
        return true;
      }

      // If clicked on a component, select it and return false to prevent drag
      const closest = target.closest('.moveable-box');
      if (closest && !target.classList.contains('delete-icon')) {
        const id = closest.getAttribute('widgetid');
        const isMultiSelect = e.inputEvent.shiftKey;
        if (isMultiSelect) {
          const selectedComponents = getSelectedComponents();
          if (!selectedComponents.includes(id)) {
            const mergedArray = [...selectedComponents, id];
            setSelectedComponents(mergedArray);
          }
        } else {
          setSelectedComponents([id]);
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
        dragCondition={handleDragCondition}
        hitRate={0}
      />
    </>
  );
};
