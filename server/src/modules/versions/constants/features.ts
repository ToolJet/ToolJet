import { FEATURE_KEY, REVIEW_AUDIT_KEYS } from './index';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';
import { LICENSE_FIELD } from '@modules/licensing/constants';

export const FEATURES: FeaturesConfig = {
  [MODULES.VERSION]: {
    [FEATURE_KEY.GET]: {},
    [FEATURE_KEY.GET_ONE]: {},
    // Compare, reviews and AI-turn snapshots are on trial and Pro and above.
    // Compare itself is a read. The review endpoints that share this feature write their own action types.
    [FEATURE_KEY.COMPARE]: {
      license: LICENSE_FIELD.VERSION_REVIEW,
      shouldNotSkipPublicApp: true,
      auditLogsKeys: [
        REVIEW_AUDIT_KEYS.OPENED,
        REVIEW_AUDIT_KEYS.REREQUESTED,
        REVIEW_AUDIT_KEYS.CLOSED,
        REVIEW_AUDIT_KEYS.REOPENED,
      ],
    },
    // One endpoint records an approval, a request for changes or a dismissal.
    [FEATURE_KEY.REVIEW_APPROVE]: {
      license: LICENSE_FIELD.VERSION_REVIEW,
      shouldNotSkipPublicApp: true,
      auditLogsKey: REVIEW_AUDIT_KEYS.APPROVED,
      auditLogsKeys: [REVIEW_AUDIT_KEYS.CHANGES_REQUESTED, REVIEW_AUDIT_KEYS.DISMISSED],
    },
    [FEATURE_KEY.REVIEW_OVERRIDE]: {
      license: LICENSE_FIELD.VERSION_REVIEW,
      shouldNotSkipPublicApp: true,
      auditLogsKey: REVIEW_AUDIT_KEYS.OVERRIDE,
    },
    // Undo an AI turn. A public app must not widen who can rewrite its draft.
    [FEATURE_KEY.SNAPSHOT_RESTORE]: {
      license: LICENSE_FIELD.VERSION_REVIEW,
      shouldNotSkipPublicApp: true,
      auditLogsKey: 'APP_UPDATE',
    },
    [FEATURE_KEY.CREATE]: {
      auditLogsKey: 'APP_UPDATE',
    },
    [FEATURE_KEY.DELETE]: {
      auditLogsKey: 'APP_UPDATE',
    },
    [FEATURE_KEY.UPDATE]: {
      auditLogsKey: 'APP_UPDATE',
    },
    [FEATURE_KEY.UPDATE_SETTINGS]: {
      auditLogsKey: 'APP_UPDATE',
    },
    [FEATURE_KEY.PROMOTE]: {
      license: LICENSE_FIELD.VALID,
      auditLogsKey: 'APP_PROMOTE',
    },
    [FEATURE_KEY.CREATE_COMPONENTS]: {},
    [FEATURE_KEY.UPDATE_COMPONENTS]: {},
    [FEATURE_KEY.UPDATE_COMPONENT_LAYOUT]: {},
    [FEATURE_KEY.DELETE_COMPONENTS]: {},
    [FEATURE_KEY.CREATE_PAGES]: {},
    [FEATURE_KEY.CLONE_PAGES]: {},
    [FEATURE_KEY.CLONE_GROUP]: {},
    [FEATURE_KEY.UPDATE_PAGES]: {},
    [FEATURE_KEY.DELETE_PAGE]: {},
    [FEATURE_KEY.REORDER_PAGES]: {},
    [FEATURE_KEY.GET_EVENTS]: {},
    [FEATURE_KEY.CREATE_EVENT]: {},
    [FEATURE_KEY.UPDATE_EVENT]: {},
    [FEATURE_KEY.DELETE_EVENT]: {},
    [FEATURE_KEY.APP_VERSION_CREATE]: {},
    [FEATURE_KEY.APP_VERSION_DELETE]: {},
    [FEATURE_KEY.APP_VERSION_UPDATE]: {},
    [FEATURE_KEY.APP_DRAFT_VERSION_CREATE]: {},
  },
};
