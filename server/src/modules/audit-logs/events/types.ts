import { Request } from 'express';
import { User } from '@entities/user.entity';
import { Organization } from '@entities/organization.entity';
import { UserPersonalAccessToken } from '@entities/user_personal_access_tokens.entity';
import { AuditAction, AuditTargetType } from './catalog';

export type AuditActorType = 'user' | 'pat' | 'api_key';
export type AuditOutcome = 'success' | 'denied';

export interface AuditActor {
  type: AuditActorType;
  user: { id: string; name: string; email: string } | null;
  token: { id: string; name: string } | null;
  ip_address: string | null;
  user_agent: string | null;
}

export interface AuditTargetRef {
  type: AuditTargetType;
  id: string | null;
  display_name: string;
  parent: { type: string; id: string; display_name: string } | null;
}

export type AuditChange = { from: unknown; to: unknown } | { changed: true };
export type AuditChanges = Record<string, AuditChange>;

export interface AuditEventRecord {
  id: string;
  action: AuditAction;
  outcome: AuditOutcome;
  actor: AuditActor;
  target: AuditTargetRef;
  workspace_id: string | null;
  changes: AuditChanges | null;
  bulk: boolean;
  metadata: Record<string, unknown> | null;
  request_id: string;
  created_at: Date;
}

// Audit-safe view of a resource at one moment. Sensitive values are already reduced before
// they get here, so a snapshot can be logged or queued without leaking secrets.
export type Snapshot = Record<string, unknown>;

export type FieldKind = 'plain' | 'sensitive';
export type FieldSpec = Record<string, FieldKind>;

export type IdSource = `params.${string}` | `response.${string}`;

export type AuditRouteSpec =
  | { skip: string }
  | {
      action: AuditAction;
      target: { type: AuditTargetType; id: IdSource };
      // Defaults to true for every action except `*.created`.
      captureBefore?: boolean;
      // Where the after state comes from. Defaults to the handler's response. 'reload' reads the target
      // again once the handler has finished, for routes that answer with an empty body.
      after?: 'response' | 'reload' | 'none';
    };

// How the caller authenticated. Set by the auth guard of routes that accept more than one credential.
export type AuditAuthKind = 'pat' | 'api_key';

export type AuditableRequest = Request & {
  user?: User;
  personalAccessToken?: UserPersonalAccessToken;
  tj_auth?: AuditAuthKind;
  // Workspace named by the route's :workspaceIdentifier, resolved once by the auth guard.
  tj_workspace?: Organization | null;
};

export type ActiveAuditRouteSpec = Exclude<AuditRouteSpec, { skip: string }>;
