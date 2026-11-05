import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { OrganizationMcpServer } from './organization_mcp_server.entity';
import { User } from './user.entity';

/**
 * One user's OAuth connection to an OAuth MCP server. Tokens and the pending PKCE verifier are
 * encrypted; the pending state is stored only as a SHA-256 hash.
 */
@Entity('user_mcp_server_tokens')
@Unique('UQ_USER_MCP_SERVER_TOKEN', ['serverId', 'userId'])
export class UserMcpServerToken extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => OrganizationMcpServer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'server_id' })
  server: OrganizationMcpServer;

  @Column({ name: 'server_id', type: 'uuid' })
  serverId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'encrypted_access_token', type: 'text', nullable: true })
  encryptedAccessToken: string | null;

  @Column({ name: 'encrypted_refresh_token', type: 'text', nullable: true })
  encryptedRefreshToken: string | null;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  @Column({ name: 'scope', type: 'text', nullable: true })
  scope: string | null;

  @Column({ name: 'pending_state_hash', type: 'char', length: 64, nullable: true })
  pendingStateHash: string | null;

  @Column({ name: 'encrypted_pending_verifier', type: 'text', nullable: true })
  encryptedPendingVerifier: string | null;

  @Column({ name: 'pending_expires_at', type: 'timestamp', nullable: true })
  pendingExpiresAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
