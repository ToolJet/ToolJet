import useStore from '@/AppBuilder/_stores/store';

// View as only ever applies to the canvas app being previewed, never to embedded modules.
export const useCanvasAppId = () => useStore((state) => state.appStore.modules.canvas?.app?.appId);
