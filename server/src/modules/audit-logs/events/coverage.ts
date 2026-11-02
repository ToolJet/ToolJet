import { FeatureConfig } from '@modules/app/types';
import { AUDIT_CATALOG, AuditAction } from './catalog';
import { capturesBefore } from './request-utils';

/**
 * Problems that would make an audited route silently write nothing or write the wrong thing.
 * Empty means every listed feature has a usable spec. Run in CI so coverage can't slip.
 */
export function findAuditSpecProblems(
  features: Record<string, FeatureConfig>,
  auditedFeatureKeys: string[],
  adapterTargetTypes: string[]
): string[] {
  const problems: string[] = [];
  for (const key of auditedFeatureKeys) {
    const spec = features[key]?.audit;
    if (!spec) {
      problems.push(`${key}: no audit spec (add one, or { skip: reason })`);
      continue;
    }
    if ('skip' in spec) continue;

    const entry = AUDIT_CATALOG[spec.action as AuditAction];
    if (!entry) {
      problems.push(`${key}: action "${spec.action}" is not in AUDIT_CATALOG`);
      continue;
    }
    if (entry.target !== spec.target.type) {
      problems.push(`${key}: target "${spec.target.type}" does not match catalogue target "${entry.target}"`);
    }
    if (!adapterTargetTypes.includes(spec.target.type)) {
      problems.push(`${key}: no audit subject adapter for "${spec.target.type}"`);
    }
    if (spec.after === 'reload' && !capturesBefore(spec)) {
      problems.push(`${key}: after "reload" needs a before snapshot to know which target to read again`);
    }
  }
  return problems;
}
