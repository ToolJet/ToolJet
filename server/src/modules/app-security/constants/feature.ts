import { FEATURE_KEY, POLICY_FEATURE_KEY } from './index';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';

// shouldNotSkipPublicApp: the ability guard otherwise lets anyone in the workspace through on a public app.
export const FEATURES: FeaturesConfig = {
  [MODULES.APP_SECURITY]: {
    [FEATURE_KEY.GET_SCANS]: { shouldNotSkipPublicApp: true },
    [FEATURE_KEY.RUN_SCAN]: { shouldNotSkipPublicApp: true, auditLogsKey: 'APP_SCAN_RUN' },
    [FEATURE_KEY.PUBLISH_SCAN]: { shouldNotSkipPublicApp: true, auditLogsKey: 'APP_SCAN_PUBLISH' },
    [FEATURE_KEY.UPLOAD_SCAN_RESULTS]: { shouldNotSkipPublicApp: true, auditLogsKey: 'APP_SCAN_UPLOAD' },
    [FEATURE_KEY.OVERRIDE_GATE]: { shouldNotSkipPublicApp: true, auditLogsKey: 'SCAN_OVERRIDE' },
  },
  [MODULES.APP_SECURITY_POLICY]: {
    [POLICY_FEATURE_KEY.GET_POLICY]: {},
    [POLICY_FEATURE_KEY.UPDATE_POLICY]: { auditLogsKey: 'SCAN_POLICY_UPDATE' },
    [POLICY_FEATURE_KEY.LIST_EXCEPTIONS]: {},
    [POLICY_FEATURE_KEY.CREATE_EXCEPTION]: { auditLogsKey: 'SCAN_EXCEPTION_CREATE' },
    [POLICY_FEATURE_KEY.REVOKE_EXCEPTION]: { auditLogsKey: 'SCAN_EXCEPTION_DELETE' },
    [POLICY_FEATURE_KEY.SECURITY_CENTER]: {},
    [POLICY_FEATURE_KEY.RECHECK]: { auditLogsKey: 'APP_SCAN_RECHECK' },
  },
};
