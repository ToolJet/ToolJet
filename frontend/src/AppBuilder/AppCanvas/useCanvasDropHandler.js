import useStore from '@/AppBuilder/_stores/store';
import { useGridStore } from '@/_stores/gridStore';
import { shallow } from 'zustand/shallow';
import { noop } from 'lodash';
import { addChildrenWidgetsToParent, addNewWidgetToTheEditor } from '../AppCanvas/appCanvasUtils';
import { WIDGETS_WITH_DEFAULT_CHILDREN } from '../AppCanvas/appCanvasConstants';
import { RIGHT_SIDE_BAR_TAB } from '../RightSideBar/rightSidebarConstants';
import { isPDFSupported } from '@/_helpers/appUtils';
import toast from 'react-hot-toast';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { useGhostMoveable } from '../_hooks/useGhostMoveable';
import { handleDeactivateTargets, hideGridLines } from '../AppCanvas/Grid/gridUtils';

export const useCanvasDropHandler = ({ appType }) => {
  const { moduleId } = useModuleContext();

  const addComponentToCurrentPage = useStore((state) => state.addComponentToCurrentPage, shallow);
  const setActiveRightSideBarTab = useStore((state) => state.setActiveRightSideBarTab, shallow);
  const setShowModuleBorder = useStore((state) => state.setShowModuleBorder, shallow) || noop;
  const currentMode = useStore((state) => state.modeStore.modules[moduleId].currentMode, shallow);
  const currentLayout = useStore((state) => state.currentLayout, shallow);
  const setCurrentDragCanvasId = useGridStore((state) => state.actions.setCurrentDragCanvasId);
  const { deactivateGhost } = useGhostMoveable();
  const handleDrop = ({ componentType: draggedComponentType, component }, monitor, canvasId) => {
    const realCanvasRef =
      !canvasId || canvasId === 'canvas'
        ? document.getElementById(`real-canvas`)
        : document.getElementById(`canvas-${canvasId}`);

    // Ensure ghost is deactivated before processing drop
    deactivateGhost();
    handleDeactivateTargets();
    hideGridLines();

    setShowModuleBorder(false); // Hide the module border when dropping

    if (currentMode === 'view' || (appType === 'module' && draggedComponentType !== 'ModuleContainer')) {
      return;
    }

    // const didDrop = monitor.didDrop();
    // if (didDrop) {
    //   return;
    // }

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

    if (WIDGETS_WITH_DEFAULT_CHILDREN.includes(draggedComponentType)) {
      const parentComponent = addNewWidgetToTheEditor(
        draggedComponentType,
        monitor,
        currentLayout,
        realCanvasRef,
        canvasId,
        moduleInfo
      );
      const childComponents = addChildrenWidgetsToParent(draggedComponentType, parentComponent?.id, currentLayout);
      const newComponents = [parentComponent, ...childComponents];
      addComponentToCurrentPage(newComponents);
      setActiveRightSideBarTab(RIGHT_SIDE_BAR_TAB.CONFIGURATION);
    } else {
      const newComponent = addNewWidgetToTheEditor(
        draggedComponentType,
        monitor,
        currentLayout,
        realCanvasRef,
        canvasId,
        moduleInfo
      );
      addComponentToCurrentPage([newComponent]);
      setActiveRightSideBarTab(RIGHT_SIDE_BAR_TAB.CONFIGURATION);
    }
    // Reset canvas ID when dropping
    setCurrentDragCanvasId(null);
  };

  return handleDrop;
};
