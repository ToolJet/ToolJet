export const createWorkflowModalSlice = (set, get) => ({
  modal: {
    nodeDeletion: {
      showModal: false,
      idOfNodeToBeDeleted: undefined,
    },
    currentModal: null,
    modalProps: {},
  },

  actions: {
    showNodeDeletionModal: (nodeId) =>
      set((state) => {
        if (nodeId === false) {
          // Legacy support - when called with false, hide modal
          state.modal.nodeDeletion = {
            showModal: false,
            idOfNodeToBeDeleted: undefined,
          };
        } else {
          state.modal.nodeDeletion = {
            showModal: true,
            idOfNodeToBeDeleted: nodeId,
          };
        }
      }),

    hideNodeDeletionModal: () =>
      set((state) => {
        state.modal.nodeDeletion = {
          showModal: false,
          idOfNodeToBeDeleted: undefined,
        };
      }),

    setCurrentModal: (modalType, props = {}) =>
      set((state) => {
        state.modal.currentModal = modalType;
        state.modal.modalProps = props;
      }),

    closeModal: () =>
      set((state) => {
        state.modal.currentModal = null;
        state.modal.modalProps = {};
      }),
  },
});
