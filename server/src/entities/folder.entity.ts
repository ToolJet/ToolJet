import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  OneToMany,
  AfterLoad,
  JoinTable,
  Unique,
} from 'typeorm';
import { FolderApp } from './folder_app.entity';
import { App } from './app.entity';

@Entity({ name: 'folders' })
@Unique('folder_name_organization_id_unique', ['name', 'organizationId'])
export class Folder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => FolderApp, (folderApp) => folderApp.folder, { eager: true })
  folderApps: FolderApp[];

  @ManyToMany((type) => App)
  @JoinTable({
    name: 'folder_apps',
    joinColumn: {
      name: 'folder_id',
    },
    inverseJoinColumn: {
      name: 'app_id',
    },
  })
  apps: App[];

  appCount: number;

  protected count;

  @AfterLoad()
  generateCount(): void {
    if (this.folderApps) {
      this.count = this.folderApps.length;
    }
  }
}
