import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Organization } from './organization.entity';

@Entity('organization_ai_keys')
export class OrganizationAiKey extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Organization, (organization) => organization.organizationAiKey, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'organization_id', type: 'uuid', unique: true })
  organizationId: string;

  @Column({ name: 'encrypted_key', type: 'text' })
  encryptedKey: string;

  @Column({ name: 'provider', type: 'varchar', length: 50, default: 'anthropic' })
  provider: string;

  /**
   * Model slug, for providers that route to many models. OpenRouter only today —
   * every other provider resolves its model from a fixed per-tier table in the agent.
   */
  @Column({ name: 'model', type: 'varchar', length: 200, nullable: true })
  model: string | null;

  /** Context window of the selected model, captured when it was chosen. */
  @Column({ name: 'model_context_window', type: 'integer', nullable: true })
  modelContextWindow: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
