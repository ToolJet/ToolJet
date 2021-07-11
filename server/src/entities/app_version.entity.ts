import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { App } from './app.entity';

@Entity({ name: "app_versions" })
export class AppVersion {

  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column( { name: 'name' } )
  name: string;

  @Column("simple-json", { name: 'definition' } )
  definition;

  @Column( { name: 'app_id' } )
  appId: string;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;
  
  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => App, appVersion => appVersion.id)
  @JoinColumn({ name: "app_id" })
  app: App;
  
}
