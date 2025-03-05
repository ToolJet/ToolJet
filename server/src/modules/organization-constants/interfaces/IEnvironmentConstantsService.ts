export interface EnvironmentConstant {
  id: string;
  name: string;
  values: EnvironmentConstantValue[];
  createdAt: string;
  type: 'Global' | 'Secret';
  fromEnv?: boolean;
}

export interface EnvironmentConstantValue {
  environmentName: string;
  value: any;
  id: string;
}

export interface EnvironmentConstantWithValue {
  id: string;
  name: string;
  type: 'Global' | 'Secret';
  value: any;
  fromEnv?: boolean;
}

export interface IEnvironmentConstantsService {
  /**
   * Parses environment constants from process.env
   * @param organizationId The ID of the organization
   * @returns Array of environment constants
   */
  parseEnvironmentConstants(organizationId: string): Promise<EnvironmentConstant[]>;

  /**
   * Gets constants for an organization, optionally filtered by environment and type
   * @param organizationId The ID of the organization
   * @param environmentId Optional ID of the environment to filter by
   * @param type Optional type of constants to filter by ('Global' or 'Secret')
   * @param resolveSecrets Whether to resolve secret values or mask them
   * @returns Array of constants, with values if environmentId is provided
   */
  getConstants(
    organizationId: string,
    environmentId?: string,
    type?: 'Global' | 'Secret',
    resolveSecrets?: boolean
  ): Promise<EnvironmentConstant[] | EnvironmentConstantWithValue[]>;

  /**
   * Gets a specific constant by name for an organization and environment
   * @param name The name of the constant
   * @param organizationId The ID of the organization
   * @param environmentId The ID of the environment
   * @param type The type of constant ('Global' or 'Secret')
   * @param resolveSecrets Whether to resolve secret values or mask them
   * @returns The constant if found, otherwise undefined
   */
  getOrgEnvironmentConstant(
    name: string,
    organizationId: string,
    environmentId: string,
    type: 'Global' | 'Secret',
    resolveSecrets?: boolean
  ): Promise<EnvironmentConstantWithValue | undefined>;
}
