import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { File } from 'src/entities/file.entity';

@Entity({ name: 'plugins' })
export class Plugin {
  @PrimaryGeneratedColumn()
  public id: string;

  @Column({ name: 'plugin_id' })
  pluginId: string;

  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'repo' })
  repo: string;

  @Column({ name: 'version' })
  version: string;

  @Column({ name: 'description' })
  description: string;

  @Column({ name: 'index_file_id' })
  indexFileId: string;

  @Column({ name: 'operations_file_id' })
  operationsFileId: string;

  @Column({ name: 'icon_file_id' })
  iconFileId: string;

  @Column({ name: 'manifest_file_id' })
  manifestFileId: string;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => File, (file) => file.id)
  @JoinColumn({ name: 'index_file_id' })
  indexFile?: File;

  @OneToOne(() => File, (file) => file.id)
  @JoinColumn({ name: 'operations_file_id' })
  operationsFile?: File;

  @OneToOne(() => File, (file) => file.id)
  @JoinColumn({ name: 'icon_file_id' })
  iconFile?: File;

  @OneToOne(() => File, (file) => file.id)
  @JoinColumn({ name: 'manifest_file_id' })
  manifestFile?: File;
}
