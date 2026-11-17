/** Whether an AI turn is building or changing this app: the canvas then says "Editing paused", and code edits wait. */
export const selectAgentBuilding = (state) =>
  Boolean(state.ai?.isLoading && state.ai?.currentConversation === 'generate');
