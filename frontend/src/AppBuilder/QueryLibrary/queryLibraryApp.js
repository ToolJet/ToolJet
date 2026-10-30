import { fetchEdition } from '@/modules/common/helpers/utils';
import { getSubpath } from '@/_helpers/routes';
import { getWorkspaceId } from '@/_helpers/utils';

export const isQueryLibraryEditionSupported = () => ['ee', 'cloud'].includes(fetchEdition());
export const isQueryLibraryEnabled = (featureAccess) =>
  isQueryLibraryEditionSupported() && featureAccess?.queryLibraryEnabled === true;
export const queryLibraryUrl = () => `${getSubpath() ?? ''}/${getWorkspaceId()}/query-library`;
