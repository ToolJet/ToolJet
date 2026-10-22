import posthogHelper from '@/modules/common/helpers/posthogHelper';
import { authenticationService } from '@/_services';

const workspaceId = () =>
  authenticationService?.currentUserValue?.organization_id ||
  authenticationService?.currentSessionValue?.current_organization_id;

export const trackTemplateEvent = (event, properties = {}) =>
  posthogHelper.captureEvent(event, { workspace_id: workspaceId(), ...properties });
