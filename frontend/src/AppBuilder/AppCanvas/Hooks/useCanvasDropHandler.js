import useStore from '@/AppBuilder/_stores/store';
import { useGridStore } from '@/_stores/gridStore';
import { shallow } from 'zustand/shallow';
import { noop } from 'lodash';
import { addChildrenWidgetsToParent, addNewWidgetToTheEditor, addDefaultButtonIdToForm } from '../appCanvasUtils';
import { WIDGETS_WITH_DEFAULT_CHILDREN } from '../appCanvasConstants';
import { RIGHT_SIDE_BAR_TAB } from '../../RightSideBar/rightSidebarConstants';
import { isPDFSupported } from '@/_helpers/appUtils';
import toast from 'react-hot-toast';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { handleDeactivateTargets, hideGridLines } from '../Grid/gridUtils';
import { appsService } from '@/_services';

const BUFFER_OFFSET = 15;

/**
 * Fetch every module in the workspace scoped to the active branch (header injected
 * by authHeader). Used to refresh the modules store after hydrating a stub on drop
 * so that module_container / input_items / defaultSize reflect real data instead
 * of an empty stub placeholder.
 */
const fetchAllModulesPaged = async () => {
  const all = [];
  let currentPage = 1;
  let totalPages = 1;
  while (currentPage <= totalPages) {
    const data = await appsService.getAll(currentPage, '', '', 'module');
    all.push(...(data?.apps || []));
    const pageCount = Number(data?.meta?.total_pages);
    totalPages = Number.isFinite(pageCount) && pageCount > 0 ? pageCount : currentPage;
    currentPage += 1;
  }
  return all;
};

/**
 * Mirror ModuleManager's version-priority so both surfaces reference the same
 * version after hydration: prefer a promoted main-branch version, fall back to
 * any main-branch version, then to the first returned version.
 */
const pickDefaultVersion = (appVersions = []) => {
  return (
    appVersions.find((v) => v.version_type === 'version' && !v.branch_id && v.status !== 'DRAFT') ??
    appVersions.find((v) => v.version_type === 'version' && !v.branch_id) ??
    appVersions[0]
  );
};

export const useCanvasDropHandler = () => {
  const { isModuleEditor } = useModuleContext();

  const addComponentToCurrentPage = useStore((state) => state.addComponentToCurrentPage, shallow);
  const setActiveRightSideBarTab = useStore((state) => state.setActiveRightSideBarTab, shallow);
  const setShowModuleBorder = useStore((state) => state.setShowModuleBorder, shallow) || noop;
  const currentLayout = useStore((state) => state.currentLayout, shallow);
  const setCurrentDragCanvasId = useGridStore((state) => state.actions.setCurrentDragCanvasId);
  const setRightSidebarOpen = useStore((state) => state.setRightSidebarOpen, shallow);
  const setModulesList = useStore((state) => state.setModulesList, shallow) || noop;
  const setFlexContainerDropTarget = useStore((state) => state.setFlexContainerDropTarget, shallow);

  const handleDrop = async ({ componentType: draggedComponentType, component }, canvasId) => {
    const realCanvasRef =
      !canvasId || canvasId === 'canvas'
        ? document.getElementById(`real-canvas`)
        : document.getElementById(`canvas-${canvasId}`);
    const isParentModuleContainer = realCanvasRef?.getAttribute('component-type') === 'ModuleContainer';
    handleDeactivateTargets();
    hideGridLines();
    setShowModuleBorder(false); // Hide the module border when dropping

    try {
      if (isModuleEditor && canvasId === 'canvas') {
        return;
      }

      if (!isModuleEditor && isParentModuleContainer) {
        return toast.error('Modules cannot be edited inside an app');
      }

      if (draggedComponentType === 'PDF' && !isPDFSupported()) {
        toast.error(
          'PDF is not supported in this version of browser. We recommend upgrading to the latest version for full support.'
        );
        return;
      }

      setActiveRightSideBarTab(RIGHT_SIDE_BAR_TAB.CONFIGURATION);
      setRightSidebarOpen(true);

      // If the dragged module is a git-pulled stub (no real version imported yet),
      // hydrate it server-side BEFORE building moduleInfo. Otherwise the stub's
      // UUID version name would be persisted into properties.moduleVersionId.value
      // and the by-correlation/by-name endpoint would fail on any workspace that
      // later pulls the parent app. GET /apps/:id with the active branchId header
      // triggers AppsService.getOne → hydrateStubApp server-side. After hydration
      // we re-fetch the modules list so module_container / input_items are real.
      let dropComponent = component;
      if (dropComponent?.moduleId && dropComponent?.isStub && dropComponent?.appId) {
        // Snapshot the drag ghost's bounding rect NOW, while the element is still
        // mounted. The async hydration below lets the browser complete the drag
        // lifecycle, which removes the ghost from the DOM. After that,
        // getBoundingClientRect() on the detached node returns all-zeros, causing
        // the widget to land at (0,0) instead of the drop position.
        const ghostPos = useGridStore.getState().getGhostDragPosition();
        if (ghostPos?.e?.target) {
          const frozenTargetRect = ghostPos.e.target.getBoundingClientRect();
          useGridStore.getState().actions.setGhostDragPosition({ ...ghostPos, frozenTargetRect });
        }

        const toastId = toast.loading('Loading module from git…');
        try {
          await appsService.getApp(dropComponent.appId);
          const refreshed = await fetchAllModulesPaged();
          setModulesList(refreshed);
          const hydrated = refreshed.find((m) => m.id === dropComponent.appId);
          if (!hydrated) {
            toast.error('Module could not be hydrated', { id: toastId });
            return;
          }
          const hydratedVersion = pickDefaultVersion(hydrated.app_versions);
          if (!hydratedVersion || hydratedVersion.is_stub) {
            toast.error('Module is still not ready. Please try again.', { id: toastId });
            return;
          }
          dropComponent = {
            ...dropComponent,
            isStub: false,
            versionId: hydratedVersion.module_reference_id ?? hydratedVersion.moduleReferenceId,
            versionName: hydratedVersion.name ?? '',
            environmentId: hydratedVersion.current_environment_id,
            moduleContainer: hydrated.module_container,
            defaultSize: {
              width: hydrated.module_container?.layouts?.[currentLayout]?.width ?? dropComponent.defaultSize?.width,
              height: hydrated.module_container?.layouts?.[currentLayout]?.height ?? dropComponent.defaultSize?.height,
            },
          };
          toast.dismiss(toastId);
        } catch (err) {
          console.error('[useCanvasDropHandler] hydrate module failed', err);
          toast.error('Failed to load module from git', { id: toastId });
          return;
        }
      }

      // IMPORTANT: This logic needs to be changed when we implement the module versioning
      const moduleInfo = dropComponent?.moduleId
        ? {
            moduleId: dropComponent.moduleId,
            versionId: dropComponent.versionId,
            versionName: dropComponent.versionName ?? '',
            environmentId: dropComponent.environmentId,
            moduleName: dropComponent.displayName,
            moduleContainer: dropComponent.moduleContainer,
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

      // const canvas = document.querySelector('.canvas-container');
      // const sidebar = document.querySelector('.editor-sidebar');
      // const droppedElem = document.getElementById(addedComponent?.[0]?.id);

      // if (!canvas || !sidebar || !droppedElem) return;

      // const droppedRect = droppedElem.getBoundingClientRect();
      // const sidebarRect = sidebar.getBoundingClientRect();

      // const isOverlapping = droppedRect.right > sidebarRect.left && droppedRect.left < sidebarRect.right;

      // if (isOverlapping) {
      //   const overlap = droppedRect.right - sidebarRect.left;
      //   canvas.scrollTo({
      //     left: canvas.scrollLeft + overlap + BUFFER_OFFSET,
      //     behavior: 'smooth',
      //   });
      // }
    } finally {
      // Reset drag bookkeeping when dropping
      setCurrentDragCanvasId(null);
      setFlexContainerDropTarget(null);
    }
  };

  return { handleDrop };
};
