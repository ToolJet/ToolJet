import { App } from 'src/entities/app.entity';
import { Folder } from 'src/entities/folder.entity';
import { Entity, PrimaryGeneratedColumn, JoinColumn, OneToOne, ManyToOne, Column, CreateDateColumn, UpdateDateColumn, } from 'typeorm';

@Entity({ name: "folder_apps" })
export class FolderApp {

  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column( { name: 'folder_id' } )
  folderId: string;

  @Column( { name: 'app_id' } )
  appId: string;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;
  
  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Folder, folder => folder.id)
  @JoinColumn({ name: "folder_id" })
  folder: Folder;  

  @ManyToOne(() => App, folder => folder.id)
  @JoinColumn({ name: "app_id" })
  app: App;  

}
