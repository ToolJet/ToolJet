import { join } from 'path';
import { getTooljetEdition } from '@helpers/utils.helper';
const fs = require('fs').promises;
const path = require('path');

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
    // If 'src' exists, we are in a development environment, so we use 'src/modules'
    // If 'src' does not exist, we are in a production environment, so we use 'dist/modules'
    // This is only for migrations, not for normal server startup
    const isSrcPresent = await checkIfSrcPresent();
    baseDir = isSrcPresent ? '' : baseDir;
  }

  switch (repoType) {
    case TOOLJET_EDITIONS.CE:
      return `${join(process.cwd(), baseDir, 'src/modules')}`;
    case TOOLJET_EDITIONS.EE:
      return `${join(process.cwd(), baseDir, 'ee')}`;
    case TOOLJET_EDITIONS.Cloud:
      return `${join(process.cwd(), baseDir, 'ee')}`;
    default:
      return `${join(process.cwd(), baseDir, 'src/modules')}`;
  }
};

const checkIfSrcPresent = async () => {
  // This function should not be called on normal server startup, only for migrations
  try {
    const srcModulesPath = path.join(process.cwd(), 'src', 'modules');
    const stat = await fs.stat(srcModulesPath);
    return stat.isDirectory();
  } catch (err) {
    // If directory doesn't exist, stat will throw
    if (err.code === 'ENOENT') return false;
    return false;
  }
};

export enum FEATURE_KEY {
  HEALTH = 'health',
  ROOT = 'root',
}

export const AUDIT_LOGS_REQUEST_CONTEXT_KEY = 'tj_audit_logs_meta_data';
