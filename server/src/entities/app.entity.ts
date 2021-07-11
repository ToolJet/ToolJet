import { User } from 'src/entities/user.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BeforeInsert, BeforeUpdate, ManyToOne, JoinColumn, AfterUpdate, Repository, AfterInsert, createQueryBuilder, getRepository, OneToMany, OneToOne, } from 'typeorm';
import { AppVersion } from './app_version.entity';
import { FolderApp } from './folder_app.entity';

@Entity({ name: "apps" })
export class App {

  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column( { name: 'name' } )
  name: string;

  @Column( { name: 'slug', unique: true } )
  slug: string;

  @Column({ name: 'organization_id' }) 
  organizationId: string

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;
  
  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;
  
  @ManyToOne(() => User, user => user.id)
  @JoinColumn({ name: "user_id" })
    user: User;
    
  @OneToMany(() => AppVersion, appVersion => appVersion.app, { eager: false })
  appVersions: AppVersion[];
  
  @OneToOne(() => AppVersion, appVersion => appVersion.app, { eager: true })
  currentVersion: AppVersion;

  @AfterInsert()
  updateSlug() {
    const userRepository = getRepository(App);
    userRepository.update(this.id, { slug: this.id })
  }

}
