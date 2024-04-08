import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { LICENSE_TYPE } from 'src/helpers/license.helper';
import { Terms } from '@ee/licensing/types';
import { Organization } from './organization.entity';

@Entity({ name: 'organization_license' })
export class OrganizationsLicense extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'license_key' })
  licenseKey: string;

  @Column({
    type: 'enum',
    enumName: 'license_type',
    name: 'license_type',
    enum: [LICENSE_TYPE.TRIAL, LICENSE_TYPE.ENTERPRISE, LICENSE_TYPE.BUSINESS],
  })
  licenseType: string;

  @Column({ name: 'expiry_date' })
  expiryDate: Date; // this should be with time add 23:59:59

  @Column({ name: 'expiry_with_grace_period' })
  expiryWithGracePeriod: Date;

  @Column({ type: 'json' })
  terms: Terms;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => Organization, (organization) => organization.id)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;
}
