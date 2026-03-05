import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  BaseEntity,
  Unique,
} from 'typeorm';
import { Organization } from './organization.entity';

@Entity({ name: 'workspace_branches' })
@Unique(['organizationId', 'name'])
export class WorkspaceBranch extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column()
  name: string;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  @Column({ name: 'source_branch_id', nullable: true })
  sourceBranchId: string;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Organization, (org) => org.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @ManyToOne(() => WorkspaceBranch, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'source_branch_id' })
  sourceBranch: WorkspaceBranch;
}
