export enum OrganizationConstantType {
  GLOBAL = 'Global',
  SECRET = 'Secret',
  SERVER = 'Server',
}

export const SECRET_VALUE_MASK = '********';

export enum ConstantSource {
  WORKSPACE = 'workspace',
  ENV = 'env',
}

export enum ConstantListSort {
  NAME_ASC = 'name_asc',
  NAME_DESC = 'name_desc',
  MODIFIED_DESC = 'modified_desc',
  MODIFIED_ASC = 'modified_asc',
}

export enum FEATURE_KEY {
  LIST = 'list', // Paged, filtered list of constants for one environment (secret values never returned)
  GET = 'get', // One constant with every environment's value state
  BULK_DELETE = 'bulk_delete', // Delete several constants at once
  GET_DECRYPTED_CONSTANTS = 'get_decrypted', // List constants with every environment's value; secrets stay masked
  GET_PUBLIC = 'get_public', // For fetching public constants
  GET_FROM_APP = 'get_from_app', // Fetch constants by app slug
  GET_FROM_ENVIRONMENT = 'get_from_environment', // Fetch constants by environment
  CREATE = 'create', // Create new organization constants
  UPDATE = 'update', // Update existing organization constants
  DELETE = 'delete', // Delete organization constants
  GET_SECRETS = 'get_secrets', //Get all secrets
}
