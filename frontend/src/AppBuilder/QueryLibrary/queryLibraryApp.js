import { fetchEdition } from '@/modules/common/helpers/utils';
import { getSubpath } from '@/_helpers/routes';
import { getWorkspaceId } from '@/_helpers/utils';

export const isQueryLibraryEnabled = () => fetchEdition() !== 'ce';
export const queryLibraryUrl = () => `${getSubpath() ?? ''}/${getWorkspaceId()}/query-library`;
