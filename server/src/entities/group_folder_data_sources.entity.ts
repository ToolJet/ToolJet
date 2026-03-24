import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Folder } from './folder.entity';
import { FolderDataSourcesGroupPermissions } from './folder_data_sources_group_permissions.entity';

@Entity({ name: 'group_folder_data_sources' })
@Unique(['folderId', 'folderDataSourcesGroupPermissionsId'])
export class GroupFolderDataSources extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'folder_data_sources_group_permissions_id' })
  folderDataSourcesGroupPermissionsId: string;

  @Column({ name: 'folder_id' })
  folderId: string;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => FolderDataSourcesGroupPermissions, (folderDataSourcePermissions) => folderDataSourcePermissions.id)
  @JoinColumn({ name: 'folder_data_sources_group_permissions_id' })
  folderDataSourcesGroupPermissions: FolderDataSourcesGroupPermissions;

  @ManyToOne(() => Folder, (folder) => folder.id)
  @JoinColumn({ name: 'folder_id' })
  folder: Folder;
}
