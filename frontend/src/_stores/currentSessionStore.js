import create from 'zustand';
import { zustandDevTools } from './utils';
import { organizationService } from '@/_services';

const initialState = {
  organizations: [],
  isGettingOrganizations: false,
};

//TODO: migrate all rxjs functions to zustand in future
export const useCurrentSessionStore = create(
  zustandDevTools(
    (set, get) => ({
      ...initialState,
      actions: {
        fetchOrganizations: async () => {
          if (get().isGettingOrganizations || get().organizations.length) return;
          try {
            set({ isGettingOrganizations: true });
            const response = await organizationService.getOrganizations();
            set({ organizations: response.organizations, isGettingOrganizations: false });
          } catch (error) {
            console.error('Error while fetching organizations', error);
          }
        },
        setOrganizations: (organizations) => set({ organizations }),
      },
    }),
    { name: 'Current Session Store' }
  )
);

export const useCurrentSessionStoreActions = () => useCurrentSessionStore((state) => state.actions);
