import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { AppEnvironment } from './app_environments.entity';
import { OrganizationConstant } from './organization_constants.entity';

@Entity({ name: 'org_environment_constant_values' })
@Unique(['organizationConstantId', 'environmentId'])
export class OrgEnvironmentConstantValue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_constant_id' })
  organizationConstantId: string;

  @Column({ name: 'environment_id' })
  environmentId: string;

  @Column({ name: 'value' })
  value: string;
  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => OrganizationConstant, (oc) => oc.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_constant_id' })
  organizationConstant: OrganizationConstant;

  @ManyToOne(() => AppEnvironment, (ae) => ae.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'environment_id' })
  appEnvironment: AppEnvironment;
}
