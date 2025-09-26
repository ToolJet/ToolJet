export const DEFAULT_WHITE_LABELLING_SETTINGS = {
  white_label_logo: 'assets/images/tj-logo.svg',
  white_label_text: 'ToolJet',
  white_label_favicon: 'assets/images/logo.svg',
};

export enum FEATURE_KEY {
  GET = 'GET', // For the get method (fetching general white-labelling info)
  UPDATE = 'UPDATE', // For the update method (updating white-labelling settings)
  GET_ORGANIZATION_WHITE_LABELS = 'GET_ORGANIZATION_WHITE_LABELS', // For the getCloudSettings method
  UPDATE_ORGANIZATION_WHITE_LABELS = 'UPDATE_WORKSPACE_SETTINGS_CLOUD', // For the updateCloudSettings method
}
// Review the name change : name looks ambigous for cloud white labelling.
