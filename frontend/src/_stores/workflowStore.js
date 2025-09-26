import create from 'zustand';

const useWorkflowStore = create((set) => ({
  workflowId: null,
  setWorkflowId: (id) => set({ workflowId: id }),
}));

export default useWorkflowStore;
