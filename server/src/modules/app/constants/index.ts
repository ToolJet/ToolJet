import { join } from 'path';
import { getTooljetEdition } from '@helpers/utils.helper';
const fs = require('fs').promises;

export const LICENSE_FEATURE_ID_KEY = 'tjLicenseFeatureId';
export enum TOOLJET_EDITIONS {
  CE = 'ce',
  EE = 'ee',
  Cloud = 'cloud',
}
export const getImportPath = async (isGetContext?: boolean, edition?: TOOLJET_EDITIONS) => {
  // isGetContext - true for migrations
  const repoType = edition || getTooljetEdition() || TOOLJET_EDITIONS.CE;
  let baseDir = 'dist';

  if (isGetContext) {
    // Check if 'src' exists in the current working directory
    const isSrcPresent = await checkIfSrcPresent();
    baseDir = isSrcPresent ? '' : baseDir;
  }

  switch (repoType) {
    case TOOLJET_EDITIONS.CE:
      return `${join(process.cwd(), baseDir, 'src/modules')}`;
    case TOOLJET_EDITIONS.EE:
      return `${join(process.cwd(), baseDir, 'ee')}`;
    case TOOLJET_EDITIONS.Cloud:
      return `${join(process.cwd(), baseDir, 'cloud')}`;
    default:
      return `${join(process.cwd(), baseDir, 'src/modules')}`;
  }
};

const checkIfSrcPresent = async () => {
  // This function should not be called on normal server startup, only for migrations
  try {
    // Read the contents of the directory
    const files = await fs.readdir(process.cwd(), { withFileTypes: true });

    // Filter out directories and check if 'src' is present
    const directories = files.filter((file) => file.isDirectory());
    return directories.some((dir) => dir.name === 'src');
  } catch (err) {
    console.error('Error reading directory:', err);
  }
};

export enum FEATURE_KEY {
  HEALTH = 'health',
  ROOT = 'root',
}

export const AUDIT_LOGS_REQUEST_CONTEXT_KEY = 'tj_audit_logs_meta_data';
