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
import { Folder } from './folder.entity';
import { DataSourceFoldersGroupPermissions } from './data_source_folders_group_permissions.entity';

@Entity({ name: 'group_data_source_folders' })
export class GroupDataSourceFolders extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'data_source_folders_group_permissions_id' })
  dataSourceFoldersGroupPermissionsId: string;

  @Column({ name: 'folder_id' })
  folderId: string;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => DataSourceFoldersGroupPermissions, (dataSourceFolderPermissions) => dataSourceFolderPermissions.id)
  @JoinColumn({ name: 'data_source_folders_group_permissions_id' })
  dataSourceFoldersGroupPermissions: DataSourceFoldersGroupPermissions;

  @ManyToOne(() => Folder, (folder) => folder.id)
  @JoinColumn({ name: 'folder_id' })
  folder: Folder;
}
