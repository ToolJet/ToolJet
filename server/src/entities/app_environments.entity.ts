import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  BaseEntity,
} from 'typeorm';
import { Organization } from './organization.entity';

@Entity({ name: 'app_environments' })
@Unique(['name', 'organizationId'])
@Unique(['organizationId', 'priority'])
export class AppEnvironment extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'default' })
  isDefault: boolean;

  @Column({ name: 'priority' })
  priority: number;

  @Column({ name: 'enabled' })
  enabled: boolean;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Organization, (organization) => organization.id)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;
}
