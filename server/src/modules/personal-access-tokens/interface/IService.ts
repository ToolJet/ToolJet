import { User } from '@entities/user.entity';

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

export interface IPersonalAccessTokensService {
  createPat(user: User, organizationId: string, name: string, expiresAt: Date): Promise<PatView & { token: string }>;
  listPats(userId: string): Promise<PatView[]>;
  deletePat(userId: string, id: string): Promise<void>;
}
