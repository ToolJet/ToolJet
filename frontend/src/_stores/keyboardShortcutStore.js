import { create, zustandDevTools } from './utils';

const initialState = {
  componentStack: [],
};

export const useKeyboardShortcutStore = create(
  zustandDevTools(
    (set, get) => ({
      ...initialState,
      actions: {
        pushComponent: (component) => set({ componentStack: [...get().componentStack, component] }),
        popComponent: () => set({ componentStack: get().componentStack.slice(0, -1) }),
        getTopComponent: () => get().componentStack[get().componentStack.length - 1],
        clearComponentStack: () => set({ componentStack: [] }),
      },
    }),
    { name: 'Keyboard Shortcut Store' }
  )
);
