import create from 'zustand';
import { zustandDevTools } from '@/_stores/utils';
import ceInvitationsStore from './invitations.store.ce';

const useInvitationsStore = create(
  zustandDevTools((set, get) => {
    ceInvitationsStore.subscribe((ceState) => {
      set((state) => ({
        ...state,
        ...ceState,
      }));
    });

    return {
      ...ceInvitationsStore.getState(),
    };
  })
);

export default useInvitationsStore;
