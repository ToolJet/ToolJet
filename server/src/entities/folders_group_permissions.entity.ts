import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { GranularPermissions } from './granular_permissions.entity';
import { GroupFolders } from './group_folders.entity';

@Entity({ name: 'folders_group_permissions' })
export class FoldersGroupPermissions extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'granular_permission_id', unique: true })
  granularPermissionId: string;

  @Column({ name: 'can_edit_folder', nullable: false, default: false })
  canEditFolder: boolean;

  @Column({ name: 'can_edit_apps', nullable: false, default: false })
  canEditApps: boolean;

  @Column({ name: 'can_view_apps', nullable: false, default: false })
  canViewApps: boolean;

  // Restrict-query-run flag. Only consumed for data-source folders (ResourceType.DATA_SOURCE_FOLDER):
  // when false, users in the group cannot run queries on data sources inside the granted folders
  // (enforced at query-execution time, see server/ee/data-queries/util.service.ts). Defaults true
  // (no restriction) and is unused for app/workflow/module folders.
  @Column({ name: 'can_run_query', nullable: false, default: true })
  canRunQuery: boolean;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => GranularPermissions, (granularPermission) => granularPermission.foldersGroupPermissions)
  @JoinColumn({ name: 'granular_permission_id' })
  granularPermissions: GranularPermissions;

  @OneToMany(() => GroupFolders, (groupFolders) => groupFolders.foldersGroupPermissions, { onDelete: 'CASCADE' })
  groupFolders: GroupFolders[];
}
