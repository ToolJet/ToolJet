import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  AfterLoad,
  BaseEntity,
  ManyToMany,
  JoinTable,
  AfterInsert,
  getRepository,
} from 'typeorm';
import { User } from './user.entity';
import { AppVersion } from './app_version.entity';
import { DataQuery } from './data_query.entity';
import { DataSource } from './data_source.entity';
import { GroupPermission } from './group_permission.entity';
import { AppGroupPermission } from './app_group_permission.entity';

@Entity({ name: 'apps' })
export class App extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'slug', unique: true })
  slug: string;

  @Column({ name: 'is_public', default: true })
  isPublic: boolean;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'current_version_id' })
  currentVersionId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => AppVersion, (appVersion) => appVersion.app, {
    eager: true,
    onDelete: 'CASCADE',
  })
  appVersions: AppVersion[];

  @OneToMany(() => DataQuery, (dataQuery) => dataQuery.app, {
    onDelete: 'CASCADE',
  })
  dataQueries: DataQuery[];

  @OneToMany(() => DataSource, (dataSource) => dataSource.app, {
    onDelete: 'CASCADE',
  })
  dataSources: DataSource[];

  @ManyToMany(() => GroupPermission)
  @JoinTable({
    name: 'app_group_permissions',
    joinColumn: {
      name: 'app_id',
    },
    inverseJoinColumn: {
      name: 'group_permission_id',
    },
  })
  groupPermissions: GroupPermission[];

  @OneToMany(() => AppGroupPermission, (appGroupPermission) => appGroupPermission.app, { onDelete: 'CASCADE' })
  appGroupPermissions: AppGroupPermission[];

  public editingVersion;

  @AfterInsert()
  updateSlug(): void {
    if (!this.slug) {
      const appRepository = getRepository(App);
      appRepository.update(this.id, { slug: this.id });
    }
  }

  @AfterLoad()
  async afterLoad(): Promise<void> {
    if (this.currentVersionId) {
      this.editingVersion = this.appVersions
        ? this.appVersions.find((version) => version.id === this.currentVersionId)
        : {};
    } else {
      this.editingVersion = this.appVersions ? this.appVersions[0] : {};
    }
  }
}
