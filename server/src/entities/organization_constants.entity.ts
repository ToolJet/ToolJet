import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  BaseEntity,
  OneToMany,
} from 'typeorm';

import { Organization } from './organization.entity';
import { OrgEnvironmentConstantValue } from './org_environment_constant_values.entity';

@Entity({ name: 'organization_constants' })
export class OrganizationConstant extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'constant_name' })
  constantName: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => OrgEnvironmentConstantValue, (oe) => oe.organizationConstant)
  orgEnvironmentConstantValues: OrgEnvironmentConstantValue[];

  @ManyToOne(() => Organization, (organization) => organization.id)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;
}
