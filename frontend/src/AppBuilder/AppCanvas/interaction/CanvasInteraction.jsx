import React, { useEffect, useRef } from 'react';
import { shallow } from 'zustand/shallow';
import { useDragLayer } from 'react-dnd';
import useStore from '@/AppBuilder/_stores/store';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { CanvasEngine } from './engine';
import GroupFrame from './GroupFrame';
import './interaction.scss';

/**
 * The editor's canvas interactions (select, move, resize, marquee, drop from the components panel). Mounted once
 * per editor canvas, in edit mode only; the engine listens on the editor root and draws its own feedback.
 */
export default function CanvasInteraction() {
  const { moduleId, isModuleEditor } = useModuleContext();
  const engineRef = useRef(null);

  useEffect(() => {
    const root = document.getElementById('main-editor-canvas');
    if (!root) return undefined;
    const engine = new CanvasEngine(root, { moduleId, isModuleEditor });
    engine.attach();
    engineRef.current = engine;
    return () => {
      engine.detach();
      engineRef.current = null;
    };
  }, [moduleId, isModuleEditor]);

  return (
    <>
      <PanelDropBridge engineRef={engineRef} />
      <GroupFrame moduleId={moduleId} />
      <CanvasBottomHeight moduleId={moduleId} />
    </>
  );
}

/** Feeds a drag from the components panel (react-dnd) to the engine, which shows where it would land. */
function PanelDropBridge({ engineRef }) {
  const { isDragging, item, offset } = useDragLayer((monitor) => ({
    isDragging: monitor.isDragging() && monitor.getItemType() === 'box',
    item: monitor.getItem(),
    offset: monitor.getClientOffset(),
  }));

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (isDragging && offset && item?.component) engine.updateInsert(offset, item);
    else if (!isDragging) engine.endInsert();
  }, [engineRef, isDragging, item, offset]);

  return null;
}

/** Keeps the page canvas tall enough for its components (it was Grid's job). */
function CanvasBottomHeight({ moduleId }) {
  const count = useStore((state) => Object.keys(state.getCurrentPageComponents(moduleId) ?? {}).length);
  const updateCanvasBottomHeight = useStore((state) => state.updateCanvasBottomHeight, shallow);
  const triggerCanvasUpdater = useStore((state) => state.triggerCanvasUpdater, shallow);
  const currentLayout = useStore((state) => state.currentLayout, shallow);
  const { position, hideLogo, hideHeader } = useStore(
    (state) => state?.pageSettings?.definition?.properties ?? {},
    shallow
  );
  const isPageMenuHidden = useStore((state) => state?.getPagesSidebarVisibility(moduleId), shallow);

  useEffect(() => {
    updateCanvasBottomHeight(useStore.getState().getCurrentPageComponents(moduleId) ?? {}, moduleId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, triggerCanvasUpdater, currentLayout, position, hideLogo, hideHeader, isPageMenuHidden, moduleId]);

  return null;
}
