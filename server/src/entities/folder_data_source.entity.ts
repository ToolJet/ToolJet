import { DataSource } from './data_source.entity';
import { Folder } from './folder.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  JoinColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

@Entity({ name: 'data_source_folders' })
@Unique('data_source_folder_unique', ['folderId', 'dataSourceId'])
export class FolderDataSource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'folder_id' })
  folderId: string;

  @Column({ name: 'data_source_id' })
  dataSourceId: string;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Folder, (folder) => folder.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'folder_id' })
  folder: Folder;

  @ManyToOne(() => DataSource, (ds) => ds.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'data_source_id' })
  dataSource: DataSource;
}
