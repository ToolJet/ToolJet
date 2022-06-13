import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  BaseEntity,
} from 'typeorm';

import { Organization } from './organization.entity';

@Entity({ name: 'org_environment_variables' })
export class OrgEnvironmentVariable extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'variable_name' })
  variableName: string;

  @Column({ name: 'value' })
  value: string;

  @Column({ type: 'enum', enumName: 'variable_type', name: 'variable_type', enum: ['client', 'server'] })
  variableType: string;

  @Column({ name: 'encrypted' })
  encrypted: boolean;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Organization, (organization) => organization.id)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;
}
