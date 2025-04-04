export const DEFAULT_WHITE_LABELLING_SETTINGS = {
  white_label_logo: 'assets/images/tj-logo.svg',
  white_label_text: 'ToolJet',
  white_label_favicon: 'assets/images/logo.svg',
};

export enum FEATURE_KEY {
  GET = 'GET', // For the get method (fetching general white-labelling info)
  UPDATE = 'UPDATE', // For the update method (updating white-labelling settings)
  GET_WORKSPACE_SETTINGS = 'GET_WORKSPACE_SETTINGS', // For the getCloudSettings method
  UPDATE_WORKSPACE_SETTINGS = 'UPDATE_WORKSPACE_SETTINGS', // For the updateCloudSettings method
}
