import { Response } from 'express';
import { User } from '@entities/user.entity';
import { UserPersonalAccessToken } from '@entities/user_personal_access_tokens.entity';

// The settings-page token table view. Workspace PATs are USER-owned and WORKSPACE-bound:
// one species (scope='workspace') consumed by the CLI today, MCP later — never per-feature kinds.
export interface PatView {
  id: string;
  name: string;
  organizationId: string;
  organizationName: string | null;
  expiresAt: Date; // always set — workspace PATs ALWAYS expire (user-picked future date)
  lastUsedAt: Date | null; // null = never used
  createdAt: Date;
}

// What a PAT buys: a short-lived SESSION, not access. The internal APIs authenticate a
// session (a dozen AuthGuard('jwt') subclasses, ~90 controllers), so the token's job is to
// mint one rather than to become a second credential every guard must learn.
export interface PatSession {
  authToken: string; // send as tj_auth_token — cookie or header
  organizationId: string; // the TOKEN's workspace; this session can reach no other
  organizationSlug: string | null;
  organizationName: string | null;
  expiresAt: Date; // session expiry, NOT the token's — re-exchange when it lapses
}

// Options for a PAT minted FOR a backend service that is acting as the signed-in user, rather than
// for a human to copy out of the settings page. The raw token is generated and discarded at
// creation, so this row can never be presented as a bearer credential; it exists only to anchor the
// session (validateUserSession rejects a PAT session whose token row has gone) and to be the kill
// switch that revokes every session minted from it.
export interface ServicePatOptions {
  expiresAt: Date; // outer ceiling: validateUserSession will not extend a session past this
  sessionExpiryMinutes: number; // idle lifetime of each session minted from the token
}

export interface IPersonalAccessTokensService {
  createPat(user: User, organizationId: string, name: string, expiresAt: Date): Promise<PatView & { token: string }>;
  listPats(userId: string): Promise<PatView[]>;
  deletePat(userId: string, id: string): Promise<void>;
  createSessionFromPat(pat: UserPersonalAccessToken, response: Response): Promise<PatSession>;
  /* Find-or-create the single service token for (user, workspace, name). Returns the ENTITY, with
     `user` populated, because the caller mints a session from it in-process via createSessionFromPat
     — no raw token is produced and none is needed. */
  getOrCreateServicePat(
    user: User,
    organizationId: string,
    name: string,
    opts: ServicePatOptions
  ): Promise<UserPersonalAccessToken>;
}
