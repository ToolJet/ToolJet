import { UnauthorizedException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { User } from '@entities/user.entity';
import { UserPersonalAccessToken } from '@entities/user_personal_access_tokens.entity';
import { getTooljetEdition } from '@helpers/utils.helper';

async function lockOwner(manager: EntityManager, userId: string) {
  // SHARE conflicts with administrative NO KEY UPDATE while remaining compatible with
  // foreign-key checks. Termination/ban always take the policy lock before their user lock.
  const [owner] = await manager.query("SELECT id FROM users WHERE id=$1 AND status='active' FOR SHARE", [userId]);
  if (!owner) throw new UnauthorizedException();
  const [ban] = await manager.query('SELECT 1 FROM user_ban_list b JOIN users u ON lower(b.email)=lower(u.email) WHERE u.id=$1', [userId]);
  if (ban) throw new UnauthorizedException();
}

export async function assertPatMintSession(manager: EntityManager, user: User) {
  if (getTooljetEdition() !== 'cloud') return;
  await lockOwner(manager, user.id);
  const [session] = await manager.query("SELECT id FROM user_sessions WHERE id=$1 AND user_id=$2 AND expiry > now() AND session_type='user'", [user.sessionId, user.id]);
  if (!session) throw new UnauthorizedException();
}

export async function assertPatExchange(manager: EntityManager, pat: UserPersonalAccessToken) {
  if (getTooljetEdition() !== 'cloud') return;
  await lockOwner(manager, pat.userId);
  const [live] = await manager.query(`SELECT id FROM user_personal_access_tokens
    WHERE id=$1 AND user_id=$2 AND token_hash=$3 AND expires_at > now()`, [pat.id, pat.userId, pat.tokenHash]);
  if (!live) throw new UnauthorizedException();
  // Internal service PATs carry the initiating browser session only in memory, never in storage.
  if (pat.isServiceToken) await assertPatMintSession(manager, pat.user);
}
