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
import { Organization } from './organization.entity';

export type McpServerAuthType = 'none' | 'header' | 'oauth';

/** Discovered OAuth endpoints for an MCP server, cached after the first sign-in. */
export interface McpServerOAuthMetadata {
  issuer: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  registrationEndpoint?: string;
  revocationEndpoint?: string;
  resource: string;
  scopes?: string[];
  tokenEndpointAuthMethods?: string[];
}

/**
 * An MCP server a workspace admin connected for the AI builder. Secrets (header value, URL query, OAuth
 * client secret) are encrypted; per-user OAuth tokens live in `user_mcp_server_tokens`.
 */
@Entity('organization_mcp_servers')
@Unique('UQ_ORG_MCP_SERVER_NAME', ['organizationId', 'name'])
export class OrganizationMcpServer extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @Column({ name: 'name', type: 'varchar', length: 50 })
  name: string;

  /** Scheme, host and path only; the query string can carry an API key and lives in `encryptedUrlQuery`. */
  @Column({ name: 'url', type: 'text' })
  url: string;

  @Column({ name: 'encrypted_url_query', type: 'text', nullable: true })
  encryptedUrlQuery: string | null;

  @Column({ name: 'auth_type', type: 'varchar', length: 16, default: 'header' })
  authType: McpServerAuthType;

  @Column({ name: 'header_name', type: 'varchar', length: 100, nullable: true })
  headerName: string | null;

  @Column({ name: 'encrypted_header_value', type: 'text', nullable: true })
  encryptedHeaderValue: string | null;

  @Column({ name: 'allow_write_tools', type: 'boolean', default: false })
  allowWriteTools: boolean;

  @Column({ name: 'oauth_client_id', type: 'text', nullable: true })
  oauthClientId: string | null;

  @Column({ name: 'encrypted_oauth_client_secret', type: 'text', nullable: true })
  encryptedOauthClientSecret: string | null;

  @Column({ name: 'oauth_token_endpoint_auth_method', type: 'varchar', length: 32, nullable: true })
  oauthTokenEndpointAuthMethod: string | null;

  @Column({ name: 'oauth_metadata', type: 'jsonb', nullable: true })
  oauthMetadata: McpServerOAuthMetadata | null;

  @Column({ name: 'enabled', type: 'boolean', default: true })
  enabled: boolean;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
