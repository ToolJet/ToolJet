import React, { useCallback, memo, useState } from 'react';
import Selecto from 'react-selecto';
import { useEditorStore, EMPTY_ARRAY } from '@/_stores/editorStore';
import { shallow } from 'zustand/shallow';
import Moveable from 'react-moveable';

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

  const [dragTarget, setDragTarget] = useState([]);

  const onAreaSelectionStart = useCallback(
    (e) => {
      console.log('onAreaSelectionStart', e);
      const isMultiSelect = e.inputEvent.shiftKey || useEditorStore.getState().selectedComponents.length > 0;
      setSelectionInProgress(true);
      setSelectedComponents([...(isMultiSelect ? useEditorStore.getState().selectedComponents : EMPTY_ARRAY)]);
    },
    [setSelectionInProgress, setSelectedComponents]
  );

  const onAreaSelection = useCallback((e) => {
    console.log('onAreaSelection', e);
    setDragTarget(e.selected);
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
      console.log('onAreaSelectionEnd', e);
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
      />
      {/* <Moveable
        target={dragTarget}
        // ref={moveableEditorRef}
        draggable={true}
        resizable={true}
        onDrag={(e) => {
          e.target.style.transform = e.transform;
        }}
        onDragGroup={(e) => {
          console.log('Dragging--------new');
          e.events.forEach((ev) => {
            ev.target.style.transform = ev.transform;
          });
        }}
        onClickGroup={(e) => window.objSelecto.clickTarget(e.inputEvent, e.inputTarget)}
        onRender={(ev) => (ev.target.style.cssText += ev.cssText)}
        // onDragStart={(_a) => {
        //   var target = _a.target,
        //     clientX = _a.clientX,
        //     clientY = _a.clientY;
        // }}
        // onDragEnd={(_a) => {
        //   var target = _a.target,
        //     isDrag = _a.isDrag,
        //     clientX = _a.clientX,
        //     clientY = _a.clientY;
        // }}
      /> */}
    </>
  );
};

export default memo(EditorSelecto);
