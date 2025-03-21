import { TelemetryDataDto } from '@modules/onboarding/dto/user.dto';
import { Metadata } from '@entities/metadata.entity';
import { FEATURE_KEY } from '../constants';
import { FeatureConfig } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';
export interface MetadataType {
  onboarded?: boolean;
  onboardingDetails?: {
    name: string;
    email: string;
    companyName: string;
    buildPurpose: string;
  };
  requestedTrial?: boolean;
  last_checked?: Date;
  latest_version?: string;
  version_ignored?: boolean;
  ignored_version?: string;
}

export interface MetaDataInfo {
  instance_id: string;
  installed_version: string;
  latest_version: string;
  onboarded: boolean;
  version_ignored: boolean;
}

type FinishInstallationBaseParams = {
  name: string;
  email: string;
  org: string;
  region: string;
  companySize?: string;
  role?: string;
  metadata?: Metadata;
};

type FinishInstallationSubclassParams = {
  telemetryData: TelemetryDataDto;
  metadata: Metadata;
  region: string;
};

export type FinishInstallationParams = FinishInstallationBaseParams | FinishInstallationSubclassParams;

interface Features {
  [FEATURE_KEY.GET_METADATA]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.METADATA]: Features;
}
