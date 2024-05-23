import React, { useCallback, memo, useContext } from 'react';
import Selecto from 'react-selecto';
import { useEditorStore, EMPTY_ARRAY } from '@/_stores/editorStore';
import { shallow } from 'zustand/shallow';

const EditorSelecto = ({
  selectionRef,
  canvasContainerRef,
  currentPageId,
  setSelectedComponent,
  appDefinition,
  selectionDragRef,
}) => {
  const { setSelectionInProgress, setSelectedComponents, scrollOptions } = useEditorStore(
    (state) => ({
      setSelectionInProgress: state?.actions?.setSelectionInProgress,
      setSelectedComponents: state?.actions?.setSelectedComponents,
      scrollOptions: state.scrollOptions,
    }),
    shallow
  );

  const onAreaSelectionStart = useCallback(
    (e) => {
      const isMultiSelect = e.inputEvent.shiftKey || useEditorStore.getState().selectedComponents.length > 0;
      setSelectionInProgress(true);
      setSelectedComponents([...(isMultiSelect ? useEditorStore.getState().selectedComponents : EMPTY_ARRAY)]);
    },
    [setSelectionInProgress, setSelectedComponents]
  );

  const onAreaSelection = useCallback((e) => {
    e.added.forEach((el) => {
      el.classList.add('resizer-select');
    });
    if (useEditorStore.getState().selectionInProgress) {
      e.removed.forEach((el) => {
        el.classList.remove('resizer-select');
      });
    }
  }, []);

  const onAreaSelectionEnd = useCallback(
    (e) => {
      setSelectionInProgress(false);
      e.selected.forEach((el, index) => {
        const id = el.getAttribute('widgetid');
        const component = appDefinition.pages[currentPageId].components[id].component;
        const isMultiSelect = e.inputEvent.shiftKey || (!e.isClick && index != 0);
        setSelectedComponent(id, component, isMultiSelect);
      });
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
    <Selecto
      dragContainer={'.canvas-container'}
      selectableTargets={['.react-draggable']}
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
        if (target.closest('.react-draggable')) {
          const closest = target.closest('.react-draggable');
          const id = closest.getAttribute('widgetid');
          const component = appDefinition.pages[currentPageId].components[id].component;
          const isMultiSelect = e.inputEvent.shiftKey;
          setSelectedComponent(id, component, isMultiSelect);
        }
        return false;
      }}
    />
  );
};

export default memo(EditorSelecto);
