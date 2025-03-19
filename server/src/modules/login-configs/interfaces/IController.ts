// src/interfaces/controllers/login-configs-controller.interface.ts
import { OrganizationConfigsUpdateDto, InstanceConfigsUpdateDto } from '../dto';
import { User as UserEntity } from '@entities/user.entity';

export interface ILoginConfigsController {
  /**
   * Get organization details with SSO configs
   * GET ['/:organizationId/public', '/public']
   */
  getOrganizationDetails(organizationId?: string): Promise<any>;

  /**
   * Get all login-configs for organization
   * GET '/organization'
   */
  getConfigs(user: UserEntity): Promise<any>;

  /**
   * Update organization SSO configs
   * PATCH '/organization-sso'
   */
  updateOrganizationSSOConfigs(body: any, user: UserEntity): Promise<any>;

  /**
   * Get instance SSO configs
   * GET '/instance-sso'
   */
  getSSOConfigs(): Promise<any>;

  /**
   * Update instance SSO configs
   * PATCH '/instance-sso'
   */
  updateSSOConfigs(body: any): Promise<any>;

  /**
   * Update instance general configs
   * PATCH '/instance-general'
   */
  updateGeneralConfigs(body: InstanceConfigsUpdateDto): Promise<any>;

  /**
   * Update organization general configs
   * PATCH '/organization-general'
   */
  updateOrganizationGeneralConfigs(body: OrganizationConfigsUpdateDto, user: UserEntity): Promise<any>;
}
