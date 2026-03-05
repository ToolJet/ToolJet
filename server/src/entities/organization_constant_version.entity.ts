import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Unique,
} from 'typeorm';
import { OrganizationConstant } from './organization_constants.entity';
import { WorkspaceBranch } from './workspace_branch.entity';
import { OrganizationConstantVersionValue } from './organization_constant_version_values.entity';

@Entity({ name: 'organization_constant_versions' })
@Unique(['organizationConstantId', 'branchId'])
export class OrganizationConstantVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_constant_id' })
  organizationConstantId: string;

  @Column({ name: 'branch_id' })
  branchId: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => OrganizationConstant, (oc) => oc.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_constant_id' })
  organizationConstant: OrganizationConstant;

  @ManyToOne(() => WorkspaceBranch, (wb) => wb.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branch_id' })
  branch: WorkspaceBranch;

  @OneToMany(() => OrganizationConstantVersionValue, (v) => v.constantVersion)
  versionValues: OrganizationConstantVersionValue[];
}
