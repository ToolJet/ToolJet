import { DeepPartial } from 'typeorm';
import { SSOConfigs } from 'src/entities/sso_config.entity';
import { Organization } from 'src/entities/organization.entity';

export interface ILoginConfigsUtilService {
  constructSSOConfigs(): Promise<{
    google: {
      enabled: boolean;
      configs: {
        client_id: string;
      };
    };
    git: {
      enabled: boolean;
      configs: {
        client_id: string;
        host_name: string;
      };
    };
    form: {
      enable_sign_up: boolean;
      enabled: boolean;
    };
    enableSignUp: boolean;
  }>;

  fetchOrganizationDetails(
    organizationId: string,
    statusList?: Array<boolean>,
    isHideSensitiveData?: boolean,
    addInstanceLevelSSO?: boolean
  ): Promise<DeepPartial<Organization> | undefined>;

  addInstanceLevelSSOConfigs(result: DeepPartial<Organization>): Promise<any>;

  hideSSOSensitiveData(ssoConfigs: DeepPartial<SSOConfigs>[], organizationName: string, organizationId: string): any;

  buildConfigs(config: any, configId: string): any;

  encryptSecret(configs: any): Promise<any>;

  decryptSecret(configs: any): Promise<any>;

  getInstanceSSOConfigs(decryptSensitiveData?: boolean): Promise<SSOConfigs[]>;

  updateInstanceSSOConfigs(params: any): Promise<SSOConfigs>;

  getConfigs(id: string): Promise<SSOConfigs>;

  validateAndUpdateSystemParams(params: any): Promise<any>;
}
