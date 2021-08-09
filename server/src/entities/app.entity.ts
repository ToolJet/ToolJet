import { User } from '../../src/entities/user.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BeforeInsert, BeforeUpdate, ManyToOne, JoinColumn, AfterUpdate, Repository, AfterInsert, createQueryBuilder, getRepository, OneToMany, OneToOne, AfterLoad, BaseEntity, } from 'typeorm';
import { AppVersion } from './app_version.entity';
import { DataQuery } from './data_query.entity';

@Entity({ name: "apps" })
export class App extends BaseEntity {

  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column( { name: 'name' } )
  name: string;

  @Column( { name: 'slug', unique: true } )
  slug: string;

  @Column( { name: 'is_public', default: true } )
  isPublic: boolean;

  @Column({ name: 'organization_id' }) 
  organizationId: string

  @Column({ name: 'current_version_id' }) 
  currentVersionId: string

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

  @OneToMany(() => DataQuery, dataQuery => dataQuery.app)
  dataQueries: DataQuery[];

  @AfterInsert()
  updateSlug() {
    const userRepository = getRepository(App);
    userRepository.update(this.id, { slug: this.id })
  }

  protected definition;

  @AfterLoad()
  afterLoad(): void {
    this.definition = this.currentVersion?.definition;
  }

  @AfterInsert()
  generateSlug() {
    if (!this.slug) {
      this.slug = this.id;
      this.save();
    }
  }
}
