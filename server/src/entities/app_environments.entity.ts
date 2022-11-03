import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { AppVersion } from './app_version.entity';

@Entity({ name: 'app_environments' })
@Unique(['versionId', 'name'])
export class AppEnvironment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'version_id' })
  versionId: string;

  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'default' })
  isDefault: boolean;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => AppVersion, (appVersion) => appVersion.id)
  @JoinColumn({ name: 'version_id' })
  appVersion: AppVersion;
}
