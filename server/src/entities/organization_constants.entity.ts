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
  Unique,
} from 'typeorm';

import { Organization } from './organization.entity';
import { OrgEnvironmentConstantValue } from './org_environment_constant_values.entity';
import { OrganizationConstantType } from '@modules/organization-constants/constants';

@Entity({ name: 'organization_constants' })
@Unique(['constantName', 'organizationId', 'type'])
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

  @Column({
    type: 'enum',
    enum: OrganizationConstantType,
    default: OrganizationConstantType.GLOBAL,
  })
  type: OrganizationConstantType;

  @OneToMany(() => OrgEnvironmentConstantValue, (oe) => oe.organizationConstant)
  orgEnvironmentConstantValues: OrgEnvironmentConstantValue[];

  @ManyToOne(() => Organization, (organization) => organization.id)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;
}
