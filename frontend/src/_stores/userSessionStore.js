import { create, zustandDevTools } from './utils';
import { authenticationService } from '@/_services/authentication.service';

const initialState = {
  current_organization_id: null,
  current_organization_name: null,
  super_admin: null,
  admin: null,
  group_permissions: null,
  app_group_permissions: null,
  organizations: [],
  authentication_status: null,
  authentication_failed: null,
  isUserUpdated: false,
  load_app: false, //key is used only in the viewer mode
};

export const useSessionStore = create(
  zustandDevTools((set) => ({
    ...initialState,
    actions: {
      updateSession: (newSession) => set(() => ({ ...authenticationService.currentSessionValue, ...newSession })),
    },
  }))
);
