const host = process.env.TOOLJET_HOST;
const subpath = process.env.SUB_PATH;

export const DEFAULT_WHITE_LABELLING_SETTINGS = {
  logo: `${host}${subpath}/assets/logo`,
  text: 'ToolJet',
  favicon: `${host}${subpath}/assets/logo`,
};

export enum FEATURE_KEY {
  GET = 'GET', // For the get method (fetching general white-labelling info)
  UPDATE = 'UPDATE', // For the update method (updating white-labelling settings)
  GET_WORKSPACE_SETTINGS = 'GET_WORKSPACE_SETTINGS', // For the getCloudSettings method
  UPDATE_WORKSPACE_SETTINGS = 'UPDATE_WORKSPACE_SETTINGS', // For the updateCloudSettings method
}
