import { FEATURE_KEY } from '.';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';
import { LICENSE_FIELD } from '@modules/licensing/constants';

/** Audit events the AI credit limits service writes itself. */
export const AI_CREDIT_AUDIT_EVENTS = [
  'AI_CREDIT_LIMIT_ENABLED',
  'AI_CREDIT_LIMIT_DISABLED',
  'AI_CREDIT_LIMIT_UPDATED',
  'AI_CREDIT_BUILDER_LIMIT_UPDATED',
  'AI_CREDIT_LIMITS_ADJUSTED',
] as const;

export const FEATURES: FeaturesConfig = {
  [MODULES.AI]: {
    [FEATURE_KEY.PING]: {
      isPublic: true,
    },
    [FEATURE_KEY.FETCH_ZERO_STATE]: {
      license: LICENSE_FIELD.AI_FEATURE,
    },
    [FEATURE_KEY.SEND_USER_MESSAGE]: {
      license: LICENSE_FIELD.AI_FEATURE,
    },
    [FEATURE_KEY.SEND_DOCS_MESSAGE]: {
      license: LICENSE_FIELD.AI_FEATURE,
    },
    [FEATURE_KEY.APPROVE_PRD]: {
      license: LICENSE_FIELD.AI_FEATURE,
    },
    [FEATURE_KEY.REWIND_STEP]: {
      license: LICENSE_FIELD.AI_FEATURE,
    },
    [FEATURE_KEY.REGENERATE_MESSAGE]: {
      license: LICENSE_FIELD.AI_FEATURE,
    },
    [FEATURE_KEY.VOTE_MESSAGE]: {
      license: LICENSE_FIELD.AI_FEATURE,
    },
    [FEATURE_KEY.GET_CREDITS_BALANCE]: {
      license: LICENSE_FIELD.AI_FEATURE,
    },
    [FEATURE_KEY.LIST_CONVERSATIONS]: {
      license: LICENSE_FIELD.AI_FEATURE,
    },
    [FEATURE_KEY.CREATE_CONVERSATION]: {
      license: LICENSE_FIELD.AI_FEATURE,
    },
    [FEATURE_KEY.GET_CONVERSATION]: {
      license: LICENSE_FIELD.AI_FEATURE,
    },
    [FEATURE_KEY.UPDATE_KEY]: {
      license: LICENSE_FIELD.AI_FEATURE,
    },
    [FEATURE_KEY.GET_KEY_SETTINGS]: {
      license: LICENSE_FIELD.AI_FEATURE,
    },
    [FEATURE_KEY.AUTO_SORT_QUERIES]: {
      license: LICENSE_FIELD.AI_FEATURE,
    },
    // Role gate only: no licence gate, as before.
    [FEATURE_KEY.FIX_WITH_AI]: {},
    [FEATURE_KEY.COPILOT]: {},
    [FEATURE_KEY.GET_THREAD_TOKEN_USAGE]: {
      license: LICENSE_FIELD.AI_FEATURE,
    },
    [FEATURE_KEY.GET_LLM_PREFERENCE]: {
      license: LICENSE_FIELD.AI_FEATURE,
    },
    [FEATURE_KEY.UPDATE_LLM_PREFERENCE]: {
      license: LICENSE_FIELD.AI_FEATURE,
    },
    [FEATURE_KEY.GET_CREDITS_USAGE]: {
      license: LICENSE_FIELD.AI_FEATURE,
    },
    [FEATURE_KEY.GET_MY_CREDITS]: {
      license: LICENSE_FIELD.AI_FEATURE,
    },
    // One save can log ENABLED and UPDATED, so the service writes audit entries itself.
    [FEATURE_KEY.UPDATE_CREDIT_LIMITS]: {
      license: LICENSE_FIELD.AI_CREDIT_LIMITS,
      skipAuditLogs: true,
      auditLogsKeys: [...AI_CREDIT_AUDIT_EVENTS],
    },
  },
};
