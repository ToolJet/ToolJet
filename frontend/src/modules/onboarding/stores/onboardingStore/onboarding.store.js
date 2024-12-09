import create from 'zustand';
import { zustandDevTools } from '@/_stores/utils';
import ceOnboardingStore from './onboarding.store.ce';

const useOnboardingStore = create(
  zustandDevTools((set, get) => {
    ceOnboardingStore.subscribe((ceState) => {
      set((state) => ({
        ...state,
        ...ceState,
      }));
    });

    return {
      ...ceOnboardingStore.getState(),
    };
  })
);

export default useOnboardingStore;
