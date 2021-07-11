import { App } from 'src/entities/app.entity';
import { Folder } from 'src/entities/folder.entity';
import { Entity, PrimaryGeneratedColumn, JoinColumn, OneToOne, ManyToOne, } from 'typeorm';

@Entity({ name: "folder_apps" })
export class FolderApp {

  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Folder, folder => folder.id)
  @JoinColumn({ name: "folder_id" })
  folder: Folder;  

}
