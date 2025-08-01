import useStore from '@/AppBuilder/_stores/store';
import { useGridStore } from '@/_stores/gridStore';
import { shallow } from 'zustand/shallow';
import { noop } from 'lodash';
import {
  addChildrenWidgetsToParent,
  addNewWidgetToTheEditor,
  addDefaultButtonIdToForm,
} from '../AppCanvas/appCanvasUtils';
import { WIDGETS_WITH_DEFAULT_CHILDREN } from '../AppCanvas/appCanvasConstants';
import { RIGHT_SIDE_BAR_TAB } from '../RightSideBar/rightSidebarConstants';
import { isPDFSupported } from '@/_helpers/appUtils';
import toast from 'react-hot-toast';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { handleDeactivateTargets, hideGridLines } from '../AppCanvas/Grid/gridUtils';
import { scrollToAvoidSidebarOverlap } from './canvasScrollUtils';

export const useCanvasDropHandler = () => {
  const { moduleId, isModuleEditor, appType } = useModuleContext();

  const addComponentToCurrentPage = useStore((state) => state.addComponentToCurrentPage, shallow);
  const setActiveRightSideBarTab = useStore((state) => state.setActiveRightSideBarTab, shallow);
  const setShowModuleBorder = useStore((state) => state.setShowModuleBorder, shallow) || noop;
  const currentMode = useStore((state) => state.modeStore.modules[moduleId].currentMode, shallow);
  const currentLayout = useStore((state) => state.currentLayout, shallow);
  const setCurrentDragCanvasId = useGridStore((state) => state.actions.setCurrentDragCanvasId);
  const setRightSidebarOpen = useStore((state) => state.setRightSidebarOpen, shallow);

  const handleDrop = async ({ componentType: draggedComponentType, component }, canvasId) => {
    const realCanvasRef =
      !canvasId || canvasId === 'canvas'
        ? document.getElementById(`real-canvas`)
        : document.getElementById(`canvas-${canvasId}`);

    handleDeactivateTargets();
    hideGridLines();

    setShowModuleBorder(false); // Hide the module border when dropping
    if (
      currentMode === 'view' ||
      (!isModuleEditor && appType === 'module' && draggedComponentType !== 'ModuleContainer') ||
      (isModuleEditor && canvasId === 'canvas')
    ) {
      return;
    }

    if (draggedComponentType === 'PDF' && !isPDFSupported()) {
      toast.error(
        'PDF is not supported in this version of browser. We recommend upgrading to the latest version for full support.'
      );
      return;
    }

    // IMPORTANT: This logic needs to be changed when we implement the module versioning
    const moduleInfo = component?.moduleId
      ? {
          moduleId: component.moduleId,
          versionId: component.versionId,
          environmentId: component.environmentId,
          moduleName: component.displayName,
          moduleContainer: component.moduleContainer,
        }
      : undefined;

    let addedComponent;

    if (WIDGETS_WITH_DEFAULT_CHILDREN.includes(draggedComponentType)) {
      let parentComponent = addNewWidgetToTheEditor(
        draggedComponentType,
        currentLayout,
        realCanvasRef,
        canvasId,
        moduleInfo
      );
      const childComponents = addChildrenWidgetsToParent(draggedComponentType, parentComponent?.id, currentLayout);
      if (draggedComponentType === 'Form') {
        parentComponent = addDefaultButtonIdToForm(parentComponent, childComponents);
      }
      addedComponent = [parentComponent, ...childComponents];
      await addComponentToCurrentPage(addedComponent);
    } else {
      const newComponent = addNewWidgetToTheEditor(
        draggedComponentType,
        currentLayout,
        realCanvasRef,
        canvasId,
        moduleInfo
      );
      addedComponent = [newComponent];
      await addComponentToCurrentPage(addedComponent);
    }

    setActiveRightSideBarTab(RIGHT_SIDE_BAR_TAB.CONFIGURATION);
    setRightSidebarOpen(true);

    // Ensure the dropped component is not hidden by the sidebar
    scrollToAvoidSidebarOverlap(addedComponent?.[0]?.id);

    // Reset canvas ID when dropping
    setCurrentDragCanvasId(null);
  };

  return { handleDrop };
};
