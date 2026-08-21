import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, BaseEntity, JoinColumn, ManyToOne } from 'typeorm';
import { Organization } from '@entities/organization.entity';
import { User } from '@entities/user.entity';

// CLI auth — dedicated table, NOT user_personal_access_tokens (embed-only invariants; see
// docs/my-docs/custom-component-library/DECISIONS-2026-07-30.md #6). SHA-256 hash, no expiry in v1.
@Entity({ name: 'cli_api_tokens' })
export class CliApiToken extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column()
  name: string; // "Manish's MacBook"

  @Column({ name: 'token_hash' })
  tokenHash: string; // sha256 of the raw tj_cli_ token

  @Column({ type: 'timestamptz', name: 'expires_at', nullable: true })
  expiresAt: Date | null; // NULL = never expires

  @Column({ type: 'timestamptz', name: 'last_used_at', nullable: true })
  lastUsedAt: Date | null; // stamped by CliTokenGuard on every authenticated call

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Organization, (organization) => organization.id)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;
}
