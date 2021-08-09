import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn,  ManyToOne, JoinColumn, ManyToMany, OneToMany, AfterLoad } from 'typeorm';
import { FolderApp } from './folder_app.entity';

@Entity({ name: "folders" })
export class Folder {

  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ name: 'organization_id' }) 
  organizationId: string

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;
  
  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => FolderApp, folderApp => folderApp.folder, { eager: true })
  folderApps: FolderApp[];

  protected count;

  @AfterLoad()
  generateCount(): void {
    this.count = this.folderApps.length;
  }

}
