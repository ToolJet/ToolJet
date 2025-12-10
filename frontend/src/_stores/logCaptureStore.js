import { create, zustandDevTools } from './utils';
import { supportService } from '@/_services';
import { shallow } from 'zustand/shallow';

const initialState = {
  isCapturing: false,
  filePath: null,
  isLoading: false,
  error: null,
};

export const useLogCaptureStore = create(
  zustandDevTools(
    (set, get) => ({
      ...initialState,
      actions: {
        checkStatus: async () => {
          try {
            const data = await supportService.getStatus();
            set({
              isCapturing: data.isActive,
              filePath: data.filePath,
              error: null,
            });
          } catch (error) {
            console.error('Error checking capture status:', error);
            set({ error: error.message });
          }
        },

        startCapture: async () => {
          set({ isLoading: true, error: null });
          try {
            const response = await supportService.startLogCapture();
            set({
              isCapturing: true,
              filePath: response.filePath,
              isLoading: false,
            });
            return response;
          } catch (error) {
            set({ isLoading: false, error: error.message });
            throw error;
          }
        },

        stopCapture: async () => {
          set({ isLoading: true, error: null });
          try {
            await supportService.stopLogCapture();
            set({
              isCapturing: false,
              isLoading: false,
            });
          } catch (error) {
            set({ isLoading: false, error: error.message });
            throw error;
          }
        },

        resetState: () => {
          set({
            isCapturing: false,
            filePath: null,
            error: null,
          });
        },
      },
    }),
    { name: 'Log Capture Store' }
  )
);

// Selector hooks
export const useIsCapturing = () => useLogCaptureStore((state) => state.isCapturing, shallow);
export const useFilePath = () => useLogCaptureStore((state) => state.filePath, shallow);
export const useLogCaptureActions = () => useLogCaptureStore((state) => state.actions, shallow);
export const useLogCaptureLoading = () => useLogCaptureStore((state) => state.isLoading, shallow);
