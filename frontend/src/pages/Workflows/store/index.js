import { createZustandStoreWithImmer } from '@/_stores/utils';

const folderDialogInitialState = {
  type: '',
  appIdToProcess: '',
  selectedFolderId: '',
  selectedFolderInitialName: '',
};

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
  folderDialogState: { ...folderDialogInitialState },
};

export const useWorkflowListStore = createZustandStoreWithImmer(
  (set) => ({
    ...initialState,
    setOpenWorkflowDialogType: (type) =>
      set((state) => {
        state.openWorkflowDialogType = type;
      }),
    setFileToImportDetails: (details) => {
      set((state) => {
        state.openWorkflowDialogType = 'import';
        state.fileToImportName = details.fileName;
        state.fileToImportContent = details.fileContent;
        state.dependentPlugins = details.dependentPlugins;
        state.dependentPluginsDetail = details.dependentPluginsDetail;
      });
    },
    setCurrentPage: (page) =>
      set((state) => {
        state.currentPage = page;
      }),
    setAppSearchQuery: (query) =>
      set((state) => {
        state.appSearchQuery = query;
      }),
    setPageSize: (size) =>
      set((state) => {
        state.pageSize = size;
      }),
    setFolderDialogState: (updatedState) =>
      set((state) => {
        state.folderDialogState = { ...state.folderDialogState, ...updatedState };
      }),
    resetFolderDialogState: () =>
      set((state) => {
        state.folderDialogState = { ...folderDialogInitialState };
      }),
  }),
  { storeName: 'Workflow list' }
);
