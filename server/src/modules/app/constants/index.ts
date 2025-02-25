import { join } from 'path';
const fs = require('fs').promises;

export const LICENSE_FEATURE_ID_KEY = 'tjLicenseFeatureId';
export enum EDITIONS {
  CE = 'ce',
  EE = 'ee',
  Cloud = 'cloud',
}
export const getImportPath = async (isGetContext?: boolean, edition?: EDITIONS) => {
  // isGetContext - true for migrations
  const repoType = edition || process.env.EDITION || EDITIONS.CE;
  let baseDir = 'dist';

  if (isGetContext) {
    // Check if 'src' exists in the current working directory
    const isSrcPresent = await checkIfSrcPresent();
    baseDir = isSrcPresent ? '' : baseDir;
  }

  switch (repoType) {
    case EDITIONS.CE:
      return `${join(process.cwd(), baseDir, 'src/modules')}`;
    case EDITIONS.EE:
      return `${join(process.cwd(), baseDir, 'ee')}`;
    case EDITIONS.Cloud:
      return `${join(process.cwd(), baseDir, 'cloud')}`;
    default:
      break;
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
