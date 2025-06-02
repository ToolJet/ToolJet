import { User } from '@entities/user.entity';
import { OrganizationConfigsUpdateDto } from '../dto';

export interface SSOConfig {
  enabled: boolean;
  configs: any;
}

export interface ILoginConfigsService {
  /**
   * Get processed organization details with SSO configs
   */
  getProcessedOrganizationDetails(organizationId: string): Promise<any>;

  /**
   * Get processed organization configs with instance configs
   */
  getProcessedOrganizationConfigs(organizationId: string): Promise<{
    organization_details: any;
    instance_configs: any;
  }>;

  /**
   * Update organization SSO configs
   */
  updateOrganizationSSOConfigs(
    user: User,
    params: {
      type: string;
      configs: any;
      enabled: boolean;
    }
  ): Promise<any>;

  /**
   * Update general organization configs
   */
  updateGeneralOrganizationConfigs(user: User, params: OrganizationConfigsUpdateDto): Promise<any>;

  /**
   * Get instance SSO configs
   */
  getInstanceSSOConfigs(): Promise<any>;

  /**
   * Update instance SSO configs
   */
  updateInstanceSSOConfigs(params: any): Promise<any>;

  /**
   * Validate and update system parameters
   */
  validateAndUpdateSystemParams(params: any, user: User): Promise<any>;
}
