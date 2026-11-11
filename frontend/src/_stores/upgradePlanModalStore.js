import { create } from 'zustand';

/**
 * Open state for the app-wide pricing table.
 *
 * Every "Upgrade" entry point — banners, the AI builder, the subscription and license pages —
 * opens the same modal through here, so what an upgrade shows is decided in one component
 * mounted at the app root. Kept free of editor imports because CE code (the legal-reasons
 * modal raised from HTTP handlers) opens it too.
 */
export const useUpgradePlanModalStore = create((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));

/** For callers outside React render — class-based action handlers, HTTP error modals. */
export const openUpgradePlanModal = () => useUpgradePlanModalStore.getState().open();
