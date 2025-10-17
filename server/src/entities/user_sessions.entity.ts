import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, JoinColumn, BaseEntity, ManyToOne } from 'typeorm';
import { User } from './user.entity';
import { UserPersonalAccessToken } from './user_personal_access_tokens.entity';
import { SessionType } from '@modules/external-apis/constants';

@Entity({ name: 'user_sessions' })
export class UserSessions extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'device' })
  device: string;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'expiry' })
  expiry: Date;

  @Column({ name: 'last_logged_in' })
  lastLoggedIn: Date;

  @Column({ name: 'session_type', type: 'enum', enum: SessionType, default: 'user' })
  sessionType: SessionType.USER | SessionType.PAT;

  @Column({ name: 'access_token', type: 'text', nullable: true })
  accessToken: string | null;

  @Column({ name: 'refresh_token', type: 'text', nullable: true })
  refreshToken: string | null;

  @Column({ name: 'token_expires_at', type: 'timestamp', nullable: true })
  tokenExpiresAt: Date | null;

  @Column({ name: 'sso_config_id', type: 'varchar', nullable: true })
  ssoConfigId: string | null;

  @ManyToOne(() => UserPersonalAccessToken, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'pat_id' })
  pat: UserPersonalAccessToken | null;
}
