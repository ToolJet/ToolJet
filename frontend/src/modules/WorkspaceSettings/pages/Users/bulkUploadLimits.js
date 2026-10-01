import { fetchEdition } from '@/modules/common/helpers/utils';

const DEFAULT_MAX_FILE_SIZE_MB = 1;

// EE and Cloud can add or update users from a CSV; CE only adds new users.
export const isBulkUpsertEnabled = () => fetchEdition() !== 'ce';

export function getBulkUploadMaxFileSizeMb() {
  if (!isBulkUpsertEnabled()) return DEFAULT_MAX_FILE_SIZE_MB;
  const configured = Number(window.public_config?.ORG_USERS_BULK_UPLOAD_MAX_FILE_SIZE_MB);
  return configured > 0 ? configured : DEFAULT_MAX_FILE_SIZE_MB;
}

export const getBulkUploadMaxFileSizeBytes = () => Math.floor(getBulkUploadMaxFileSizeMb() * 1024 * 1024);

export const isBulkUploadFileTooLarge = (file) => file?.size > getBulkUploadMaxFileSizeBytes();

export const bulkUploadFileTooLargeMessage = () =>
  `File size cannot exceed more than ${getBulkUploadMaxFileSizeMb()}MB`;
