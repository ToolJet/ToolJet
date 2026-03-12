import { createZustandStoreWithImmer } from '@/_stores/utils';

const initialState = {
  openFolderDialogType: '',
  openWorkflowDialogType: '',
  fileToImportName: '',
  fileToImportContent: null,
  dependentPlugins: [],
  dependentPluginsDetail: {},
  pageSize: 9,
  currentPage: 1,
  appSearchQuery: '',
};

export const useWorkflowListStore = createZustandStoreWithImmer(
  (set, get) => ({
    ...initialState,
    setOpenWorkflowDialogType: (type) => set({ openWorkflowDialogType: type }),
    setFileToImportDetails: (details) => {
      set({
        openWorkflowDialogType: 'import',
        fileToImportName: details.fileName,
        fileToImportContent: details.fileContent,
        dependentPlugins: details.dependentPlugins,
        dependentPluginsDetail: details.dependentPluginsDetail,
      });
    },
    setCurrentPage: (page) => set({ currentPage: page }),
    setAppSearchQuery: (query) => set({ appSearchQuery: query }),
    setPageSize: (size) => set({ pageSize: size }),
  }),
  { storeName: 'Workflow list' }
);
