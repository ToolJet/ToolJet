import { create, zustandDevTools } from './utils';
import { createUserSlice } from './slices/userSlice';
import { createOrganizationSlice } from './slices/organizationSlice';
import { createAppSlice } from './slices/appSlice';
import { createLoaderSlice } from './slices/loaderSlice';
import { createLeftSideBarSlice } from './slices/leftSideBarSlice';
import { createComponentsSlice } from './slices/componentsSlice';
import { createRightSideBarSlice } from './slices/rightSideBarSlice';
import { createModeSlice } from './slices/modeSlice';
import { createQueryPanelSlice } from './slices/queryPanelSlice';
import { createDataQuerySlice } from './slices/dataQuerySlice';
import { createDataSourceSlice } from './slices/dataSourceSlice';
import { createUndoRedoSlice } from './slices/undoRedoSlice';
import { createLayoutSlice } from './slices/layoutSlice';
import { immer } from 'zustand/middleware/immer';
import { createResolvedSlice } from './slices/resolvedSlice';
import { createEnvironmentsAndVersionsSlice } from './slices/environmentsAndVersionsSlice';
import { createEditorLicenseSlice } from './slices/editorLicenseSlice';
import { createAppVersionSlice } from './slices/appVersionSlice';
import { createPageMenuSlice } from './slices/pageMenuSlice';
import { createLicenseSlice } from './slices/licenseSlice';
import { createDependencySlice } from './slices/dependencySlice';
import { createGridSlice } from './slices/gridSlice';
import { createEventsSlice } from './slices/eventsSlice';
import { createMultiplayerSlice } from './slices/multiplayerSlice';
import { createCodeHinterSlice } from './slices/codeHinterSlice';
import { createDebuggerSlice } from './slices/debuggerSlice';
import { createGitSyncSlice } from './slices/gitSyncSlice';
import { createAiSlice } from './slices/aiSlice';
import { createWhiteLabellingSlice } from './slices/whiteLabellingSlice';
import { createModuleSlice } from './slices/moduleSlice';

export default create(
  zustandDevTools(
    immer((...state) => ({
      ...createUserSlice(...state),
      ...createOrganizationSlice(...state),
      ...createAppSlice(...state),
      ...createLoaderSlice(...state),
      ...createLeftSideBarSlice(...state),
      ...createComponentsSlice(...state),
      ...createRightSideBarSlice(...state),
      ...createModeSlice(...state),
      ...createQueryPanelSlice(...state),
      ...createDataSourceSlice(...state),
      ...createDataQuerySlice(...state),
      ...createUndoRedoSlice(...state),
      ...createResolvedSlice(...state),
      ...createLayoutSlice(...state),
      ...createEnvironmentsAndVersionsSlice(...state),
      // ...createEditorLicenseSlice(...state),
      ...createAppVersionSlice(...state),
      ...createPageMenuSlice(...state),
      ...createLicenseSlice(...state),
      ...createDependencySlice(...state),
      ...createGridSlice(...state),
      ...createEventsSlice(...state),
      ...createMultiplayerSlice(...state),
      ...createCodeHinterSlice(...state),
      ...createDebuggerSlice(...state),
      ...createGitSyncSlice(...state),
      ...createAiSlice(...state),
      ...createWhiteLabellingSlice(...state),
      ...createModuleSlice(...state),
    })),
    { name: 'App Builder Store', anonymousActionType: 'unknown' }
  )
);
