const CATEGORY_BY_TYPE = {
  database: 'Databases',
  api: 'APIs',
  ai: 'AI',
  'cloud-storage': 'Cloud Storages',
};

const getManifestData = (datasource) => {
  const manifestData = datasource?.manifestFile?.data;
  if (!manifestData) return {};

  return manifestData;
};

export const getDataSourceCategory = (datasource) => {
  const manifestData = getManifestData(datasource);
  const sourceMetadata = manifestData['tj:source'] || manifestData.source || {};
  const manifestType = sourceMetadata?.type || manifestData?.type;

  if (!manifestType || manifestType === 'object') return null;

  return Object.prototype.hasOwnProperty.call(CATEGORY_BY_TYPE, manifestType) ? manifestType : null;
};

export const getDataSourceGroupLabel = (datasource) => {
  const category = getDataSourceCategory(datasource);
  if (!category) return 'Plugins';

  return CATEGORY_BY_TYPE[category];
};
