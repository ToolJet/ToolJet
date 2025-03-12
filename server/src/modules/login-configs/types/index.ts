import { DeepPartial } from 'typeorm';
import { SSOConfigs } from '@entities/sso_config.entity';
import { Organization } from '@entities/organization.entity';
import { FEATURE_KEY } from '../constants';
import { FeatureConfig } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';

export interface InstanceSSOConfigMap {
  google?: SSOConfig;
  git?: SSOConfig;
  openid?: SSOConfig;
  form?: SSOConfig;
}

export interface SSOConfig {
  enabled: boolean;
  configs: any;
}

export interface ILoginConfigsService {
  getProcessedOrganizationDetails(organizationId: string): Promise<any>;
  getProcessedConfigs(organizationId: string): Promise<any>;
  constructSSOConfigs(): Promise<any>;
  fetchOrganizationDetails(
    organizationId: string,
    statusList?: Array<boolean>,
    isHideSensitiveData?: boolean,
    addInstanceLevelSSO?: boolean
  ): Promise<DeepPartial<Organization>>;
  updateOrganizationConfigs(organizationId: string, params: any): Promise<any>;
  getConfigs(id: string): Promise<SSOConfigs>;
  validateAndUpdateSystemParams(params: any): Promise<void>;
  getInstanceSSOConfigs(decryptSensitiveData?: boolean): Promise<SSOConfigs[]>;
  updateInstanceSSOConfigs(params: any): Promise<SSOConfigs>;
}

interface Features {
  [FEATURE_KEY.GET_PUBLIC_CONFIGS]: FeatureConfig;
  [FEATURE_KEY.GET_ORGANIZATION_CONFIGS]: FeatureConfig;
  [FEATURE_KEY.UPDATE_ORGANIZATION_SSO]: FeatureConfig;
  [FEATURE_KEY.UPDATE_ORGANIZATION_GENERAL_CONFIGS]: FeatureConfig;
  [FEATURE_KEY.UPDATE_INSTANCE_SSO]: FeatureConfig;
  [FEATURE_KEY.UPDATE_INSTANCE_GENERAL_CONFIGS]: FeatureConfig;
  [FEATURE_KEY.GET_INSTANCE_SSO]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.LOGIN_CONFIGS]: Features;
}
