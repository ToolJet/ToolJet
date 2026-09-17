import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  AfterLoad,
  JoinColumn,
  JoinTable,
  Unique,
} from 'typeorm';
import { FolderApp } from './folder_app.entity';
import { App } from './app.entity';
import { User } from './user.entity';
import { DataBaseConstraints } from 'src/helpers/db_constraints.constants';

@Entity({ name: 'folders' })
@Unique(DataBaseConstraints.FOLDER_NAME_UNIQUE, ['name', 'organizationId', 'type'])
export class Folder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  type: string;

  @Column()
  name: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: User;

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
      this.count = this.folderApps?.length || 0;
    }
  }
}
