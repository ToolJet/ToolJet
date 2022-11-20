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
@Unique(['appVersionId', 'name'])
export class AppEnvironment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'app_version_id' })
  appVersionId: string;

  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'default' })
  isDefault: boolean;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => AppVersion, (appVersion) => appVersion.id)
  @JoinColumn({ name: 'app_version_id' })
  appVersion: AppVersion;
}
