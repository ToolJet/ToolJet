import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { GroupPermission } from './group_permission.entity';
import { DataSource } from './data_source.entity';
/**
 * ███████████████████████████████████████████████████████████████████████████████
 * █                                                                             █
 * █                               DEPRECATED                                    █
 * █                                                                             █
 * █  This file is deprecated and will be removed in a future version.           █
 * █  Please use the new implementation in                                       █
 * █  `data_sources_group_permissions.entity.ts` instead.                        █
 * █                                                                             █
 * █                                                                             █
 * ███████████████████████████████████████████████████████████████████████████████
 */
@Entity({ name: 'data_source_group_permissions' })
export class DataSourceGroupPermission extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'data_source_id' })
  dataSourceId: string;

  @Column({ name: 'group_permission_id' })
  groupPermissionId: string;

  @Column({ default: false })
  read: boolean;

  @Column({ default: false })
  update: boolean;

  @Column({ default: false })
  delete: boolean;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => DataSource, (dataSource) => dataSource.id)
  @JoinColumn({ name: 'data_source_id' })
  dataSource: DataSource;

  @ManyToOne(() => GroupPermission, (groupPermission) => groupPermission.id)
  @JoinColumn({ name: 'group_permission_id' })
  groupPermission: GroupPermission;
}
/**
 * ███████████████████████████████████████████████████████████████████████████████
 * █                                                                             █
 * █                               DEPRECATED                                    █
 * █                                                                             █
 * █  This file is deprecated and will be removed in a future version.           █
 * █  Please use the new implementation in                                       █
 * █  `data_sources_group_permissions.entity.ts` instead.                        █
 * █                                                                             █
 * █                                                                             █
 * ███████████████████████████████████████████████████████████████████████████████
 */
