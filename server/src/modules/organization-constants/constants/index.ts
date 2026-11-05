export enum OrganizationConstantType {
  GLOBAL = 'Global',
  SECRET = 'Secret',
  SERVER = 'Server',
}

export const SECRET_VALUE_MASK = '********';

export enum FEATURE_KEY {
  GET_DECRYPTED_CONSTANTS = 'get_decrypted', // List constants with every environment's value; secrets stay masked
  GET_PUBLIC = 'get_public', // For fetching public constants
  GET_FROM_APP = 'get_from_app', // Fetch constants by app slug
  GET_FROM_ENVIRONMENT = 'get_from_environment', // Fetch constants by environment
  CREATE = 'create', // Create new organization constants
  UPDATE = 'update', // Update existing organization constants
  DELETE = 'delete', // Delete organization constants
  GET_SECRETS = 'get_secrets', //Get all secrets
}
