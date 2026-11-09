import { RequestContext } from '@modules/request-context/service';
import { AI_BUILDER_API_SOURCE, PAT_API_SOURCE } from '@modules/personal-access-tokens/constants';
import { EXT_API_ROUTE_PATTERN, VALIDATION_MODE_BY_SOURCE } from './constants';
import { ValidationMode, WriteSource } from '../types';

// Copy and restore reproduce already-stored data, so they never block.
const REPORT_ONLY_SOURCES = new Set<WriteSource>(['copy', 'restore']);

export function getMode(
  source: WriteSource,
  modes: Record<WriteSource, ValidationMode> = VALIDATION_MODE_BY_SOURCE
): ValidationMode {
  const mode = modes[source] ?? 'report';
  return mode === 'enforce' && REPORT_ONLY_SOURCES.has(source) ? 'report' : mode;
}

// For API requests only. Bulk paths (import, git, copy, restore) pass their source. The AI
// builder's writes arrive on sessions the PAT exchange mints with the AI source stamped in,
// so they resolve to 'ai' here, not to the enforced 'pat'.
export function resolveSource(req: any = RequestContext.currentContext?.req): WriteSource {
  if (req?.user?.tjApiSource === AI_BUILDER_API_SOURCE) return 'ai';
  if (req?.user?.tjApiSource === PAT_API_SOURCE) return 'pat';
  const url: string = req?.originalUrl ?? req?.url ?? '';
  if (EXT_API_ROUTE_PATTERN.test(url)) return 'ext_api';
  return 'ui';
}
