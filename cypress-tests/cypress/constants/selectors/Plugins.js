export const pluginSelectors = {
  regionField: '[data-cy="region-section"] .react-select__control',
  regionFieldValue: '[data-cy="region-section"] .react-select__single-value',
  amazonsesAccesKey: '[data-cy="access-key-text-field"]',
  operationDropdown: '[data-cy="operation-select-dropdown"]',
  sendEmailInputField: '[data-cy="send-mail-to-input-field"]',
  ccEmailInputField: '[data-cy="cc-to-input-field"]',
  bccEmailInputField: '[data-cy="bcc-to-input-field"]',
  sendEmailFromInputField: '[data-cy="send-mail-from-input-field"]',
  emailSubjetInputField: '[data-cy="subject-input-field"]',
  emailbodyInputField: '[data-cy="body-input-field"]',
  amazonAthenaDbName: '[data-cy="database-text-field"]',
};

export const baserowSelectors = {
  hostField: '[data-cy="host-select-dropdown"]',
  baserowApiKey: '[data-cy="api-token-text-field"]',
  table: '[data-cy="table-id-input-field"]',
  rowIdinputfield: '[data-cy="row-id-input-field"]',
};

export const appWriteSelectors = {
  projectID: '[data-cy="project-id-text-field"]',
  collectionId: '[data-cy="collectionid-input-field"]',
  documentId: '[data-cy="documentid-input-field"]',
  bodyInput: '[data-cy="body-input-field"]',
};

export const twilioSelectors = {
  toNumberInputField: '[data-cy="to-number-input-field"]',
  bodyInput: '[data-cy="body-input-field"]',
};

export const minioSelectors = {
  sslToggle: 'data-cy="ssl-enabled-toggle-input"',
  bucketNameInputField: '[data-cy="bucket-input-field"]',
  objectNameInputField: '[data-cy="objectname-input-field"]',
  contentTypeInputField: '[data-cy="contenttype-input-field"]',
  dataInput: '[data-cy="data-input-field"]',
};
