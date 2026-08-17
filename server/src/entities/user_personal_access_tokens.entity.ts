import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, BaseEntity, JoinColumn } from 'typeorm';
import { User } from '@entities/user.entity';
import { App } from '@entities/app.entity';
import { Organization } from '@entities/organization.entity';
import { PersonalAccessTokenScope } from '@modules/external-apis/constants';

@Entity({ name: 'user_personal_access_tokens' })
export class UserPersonalAccessToken extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => App, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'app_id' })
  app: App | null;

  @ManyToOne(() => Organization, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization | null;

  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organizationId: string | null;

  @Column({ name: 'name', type: 'varchar', nullable: true })
  name: string | null;

  @Column({ name: 'last_used_at', type: 'timestamptz', nullable: true })
  lastUsedAt: Date | null;

  @Column({ name: 'token_hash', type: 'varchar', length: 256 })
  tokenHash: string;

  @Column({
    name: 'scope',
    type: 'enum',
    enum: PersonalAccessTokenScope,
  })
  scope: PersonalAccessTokenScope;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'session_expiry_minutes', type: 'int', nullable: false, default: 60 })
  sessionExpiryMinutes: number;
}
