import { RequestContext } from '@modules/request-context/service';
import { PAT_API_SOURCE } from '@modules/personal-access-tokens/constants';
import {
  APP_VALIDATION_MODE_ENV,
  DEFAULT_VALIDATION_MODE,
  EXT_API_ROUTE_PATTERN,
  VALIDATION_MODES,
  WRITE_SOURCES,
} from './constants';
import { ValidationMode, WriteSource } from './types';

type ModeConfig = Partial<Record<WriteSource | '*', ValidationMode>>;

const isMode = (value: string): value is ValidationMode => (VALIDATION_MODES as readonly string[]).includes(value);
const isSource = (value: string): value is WriteSource => (WRITE_SOURCES as readonly string[]).includes(value);

// Copy and restore reproduce already-stored data, so they never block.
const REPORT_ONLY_SOURCES = new Set<WriteSource>(['copy', 'restore']);

let cachedRaw: string | undefined;
let cachedConfig: ModeConfig = {};

export function parseModeConfig(raw: string | undefined): ModeConfig {
  const config: ModeConfig = {};
  const value = (raw ?? '').trim().toLowerCase();
  if (!value) return config;

  if (isMode(value)) {
    config['*'] = value;
    return config;
  }

  for (const part of value.split(',')) {
    const [key, mode] = part.split('=').map((s) => s?.trim());
    if (!key || !mode || !isMode(mode)) continue;
    if (key === '*' || isSource(key)) config[key] = mode;
  }
  return config;
}

export function getMode(
  source: WriteSource,
  raw: string | undefined = process.env[APP_VALIDATION_MODE_ENV]
): ValidationMode {
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedConfig = parseModeConfig(raw);
  }
  const mode = cachedConfig[source] ?? cachedConfig['*'] ?? DEFAULT_VALIDATION_MODE;
  return mode === 'enforce' && REPORT_ONLY_SOURCES.has(source) ? 'report' : mode;
}

// For API requests only. Bulk paths (import, git, AI builder, copy, restore) pass their source.
export function resolveSource(req: any = RequestContext.currentContext?.req): WriteSource {
  if (req?.user?.tjApiSource === PAT_API_SOURCE) return 'pat';
  const url: string = req?.originalUrl ?? req?.url ?? '';
  if (EXT_API_ROUTE_PATTERN.test(url)) return 'ext_api';
  return 'ui';
}
