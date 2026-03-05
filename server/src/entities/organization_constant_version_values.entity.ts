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
import { OrganizationConstantVersion } from './organization_constant_version.entity';
import { AppEnvironment } from './app_environments.entity';

@Entity({ name: 'organization_constant_version_values' })
@Unique(['constantVersionId', 'environmentId'])
export class OrganizationConstantVersionValue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'constant_version_id' })
  constantVersionId: string;

  @Column({ name: 'environment_id' })
  environmentId: string;

  @Column({ name: 'value', default: '' })
  value: string;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => OrganizationConstantVersion, (cv) => cv.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'constant_version_id' })
  constantVersion: OrganizationConstantVersion;

  @ManyToOne(() => AppEnvironment, (ae) => ae.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'environment_id' })
  appEnvironment: AppEnvironment;
}
