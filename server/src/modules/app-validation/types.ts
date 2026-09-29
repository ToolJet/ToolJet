import { VALIDATION_MODES, WRITE_SOURCES } from './constants';
import type { VersionIndex } from './version-index';

export type ValidationMode = (typeof VALIDATION_MODES)[number];
export type WriteSource = (typeof WRITE_SOURCES)[number];
export type ValidationArea = 'components' | 'layouts' | 'pages' | 'events' | 'queries' | 'versionSettings';

export type Severity = 'critical' | 'high' | 'medium' | 'info';
// Only `certain` problems can block a write.
export type Confidence = 'certain' | 'heuristic';

export interface IssueEntity {
  type: 'component' | 'layout' | 'page' | 'event' | 'query' | 'version';
  id?: string;
  name?: string;
}

export interface Issue {
  code: string;
  severity: Severity;
  confidence: Confidence;
  path: string;
  message: string;
  entity?: IssueEntity;
  fix?: string;
}

export interface RuleContext {
  appVersionId: string;
  organizationId?: string;
  appType?: string;
  source: WriteSource;
  index(): Promise<VersionIndex>;
}

export interface Rule<TInput> {
  id: string;
  description: string;
  check(input: TInput, ctx: RuleContext): Issue[] | Promise<Issue[]>;
}

export interface ValidationResult {
  errors: Issue[];
  warnings: Issue[];
}

export type WriteOp = 'create' | 'update' | 'delete';

// For updates, `data` is the stored entity merged with the request and `touched` lists the
// paths the request changed (e.g. `properties.text`), so rules can block only on what changed.
export interface Write<TData> {
  op: WriteOp;
  id: string;
  data?: TData;
  touched?: string[];
}

export interface ComponentData {
  name?: string;
  type?: string;
  pageId?: string;
  parent?: string | null;
  properties?: Record<string, any>;
  styles?: Record<string, any>;
  general?: Record<string, any> | null;
  generalStyles?: Record<string, any> | null;
  validation?: Record<string, any> | null;
  displayPreferences?: Record<string, any> | null;
  layouts?: Record<string, any>;
}

export type ComponentWrite = Write<ComponentData>;
