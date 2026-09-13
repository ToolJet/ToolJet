import { MODULES } from '@modules/app/constants/modules';
import { APP_TYPES } from '@modules/apps/constants';

/**
 * App type -> permission bucket for app-git routes.
 *
 * Lives in its own file because both the guard (which decides which bucket is POPULATED) and
 * the ability factory (which decides which is READ) need it, and guard.ts <-> index.ts would
 * otherwise be a circular import. The two must never disagree: reading a bucket the guard
 * never requested yields undefined and denies every non-admin request for that type.
 *
 * Mirrors data-queries/ability/app/guard.ts:19-29 and PERMISSION_RESOURCE_BY_APP_TYPE
 * (apps/util.service.ts:51-55).
 */
export function resourceTypeForAppType(appType?: string): MODULES {
  switch (appType) {
    case APP_TYPES.MODULE:
      return MODULES.MODULES;
    case APP_TYPES.WORKFLOW:
      return MODULES.WORKFLOWS;
    default:
      return MODULES.APP;
  }
}
