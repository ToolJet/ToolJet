import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { GranularPermissions } from './granular_permissions.entity';
import { GroupDataSources } from './group_data_source.entity';

@Entity({ name: 'data_sources_group_permissions' })
export class DataSourcesGroupPermissions extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'granular_permission_id' })
  granularPermissionId: string;

  @Column({ name: 'can_configure', nullable: false, default: false })
  canConfigure: boolean;

  @Column({ name: 'can_use', nullable: false, default: false })
  canUse: boolean;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => GranularPermissions, (granularPermission) => granularPermission.id)
  @JoinColumn({ name: 'granular_permission_id' })
  granularPermissions: GranularPermissions;

  @OneToMany(() => GroupDataSources, (groupDataSource) => groupDataSource.dataSourcesGroupPermissions, {
    onDelete: 'CASCADE',
  })
  groupDataSources: GroupDataSources[];
}
