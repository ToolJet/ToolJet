import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
  BaseEntity,
} from 'typeorm';
import { User } from './user.entity';
import { App } from './app.entity';
import { AppVersion } from './app_version.entity';

@Entity({ name: 'user_app_version_state' })
@Unique(['userId', 'appId'])
export class UserAppVersionState extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'app_id', type: 'uuid' })
  appId: string;

  @ManyToOne(() => App, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'app_id' })
  app: App;

  // SET NULL, not CASCADE: deleting the referenced version must not delete this row.
  @Index()
  @Column({ name: 'version_id', type: 'uuid', nullable: true })
  versionId?: string | null;

  @ManyToOne(() => AppVersion, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'version_id' })
  version?: AppVersion | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
