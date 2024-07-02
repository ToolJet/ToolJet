import React, { useCallback, memo } from 'react';
import Selecto from 'react-selecto';
import { useEditorStore } from '@/_stores/editorStore';
import { shallow } from 'zustand/shallow';
import { setMultipleComponentsSelected } from '@/_helpers/appUtils';

const EditorSelecto = ({ selectionRef, canvasContainerRef, setSelectedComponent, selectionDragRef }) => {
  const { setSelectionInProgress, currentPageId, appDefinition } = useEditorStore(
    (state) => ({
      setSelectionInProgress: state?.actions?.setSelectionInProgress,
      currentPageId: state?.currentPageId,
      appDefinition: state?.appDefinition,
    }),
    shallow
  );

  const scrollOptions = {
    container: canvasContainerRef.current,
    throttleTime: 30,
    threshold: 0,
  };

  const onAreaSelectionStart = useCallback(() => {
    setSelectionInProgress(true);
  }, [setSelectionInProgress]);

  const onAreaSelection = useCallback((e) => {
    e.added.forEach((el) => {
      el.classList.add('resizer-select');
    });
    if (useEditorStore.getState().selectionInProgress) {
      e.removed.forEach((el) => {
        el.classList.remove('resizer-select');
      });
    }
    e.removed.forEach((el) => {
      el.classList.remove('resizer-select');
    });
  }, []);

  const onAreaSelectionEnd = useCallback(
    (e) => {
      setSelectionInProgress(false);
      const selectedItems = [];
      e.selected.forEach((el, index) => {
        const id = el.getAttribute('widgetid');
        const component = appDefinition.pages[currentPageId].components[id].component;
        const isMultiSelect = e.inputEvent.shiftKey || (!e.isClick && index != 0);
        if (e.selected.length > 0 && !e.isClick) {
          selectedItems.push({
            id,
            component,
          });
        } else {
          setSelectedComponent(id, component, isMultiSelect);
        }
      });
      if (selectedItems.length > 0) {
        setMultipleComponentsSelected(selectedItems);
      }
    },
    [appDefinition, currentPageId, setSelectedComponent, setSelectionInProgress]
  );

  const onAreaSelectionDragStart = useCallback(
    (e) => {
      if (e.inputEvent.target.getAttribute('id') !== 'real-canvas') {
        selectionDragRef.current = true;
      } else {
        selectionDragRef.current = false;
      }
    },
    [selectionDragRef]
  );

  const onAreaSelectionDrag = useCallback(
    (e) => {
      if (selectionDragRef.current) {
        e.stop();
        useEditorStore.getState().selectionInProgress && setSelectionInProgress(false);
      }
    },
    [setSelectionInProgress, selectionDragRef]
  );

  const onAreaSelectionDragEnd = () => {
    selectionDragRef.current = false;
    useEditorStore.getState().selectionInProgress && setSelectionInProgress(false);
  };

  return (
    <>
      <Selecto
        dragContainer={'.canvas-container'}
        selectableTargets={['.moveable-box']}
        hitRate={0}
        selectByClick={true}
        toggleContinueSelect={['shift']}
        ref={selectionRef}
        scrollOptions={scrollOptions}
        onSelectStart={onAreaSelectionStart}
        onSelectEnd={onAreaSelectionEnd}
        onSelect={onAreaSelection}
        onDragStart={onAreaSelectionDragStart}
        onDrag={onAreaSelectionDrag}
        onDragEnd={onAreaSelectionDragEnd}
        onScroll={(e) => {
          canvasContainerRef.current.scrollBy(e.direction[0] * 10, e.direction[1] * 10);
        }}
        dragCondition={(e) => {
          // clear browser selection on drag
          const selection = window.getSelection();
          if (selection) {
            selection.removeAllRanges();
          }
          const target = e.inputEvent.target;
          if (target.getAttribute('id') === 'real-canvas') {
            return true;
          }
          // if clicked on a component, select it and return false to prevent drag
          if (target.closest('.moveable-box')) {
            const closest = target.closest('.moveable-box');
            const id = closest.getAttribute('widgetid');
            const component = appDefinition.pages[currentPageId].components[id].component;
            const isMultiSelect = e.inputEvent.shiftKey;
            setSelectedComponent(id, component, isMultiSelect);
          }
          return false;
        }}
      />
    </>
  );
};

export default memo(EditorSelecto);
