import { PrimaryGeneratedColumn, BaseEntity, Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { App } from './app.entity';
import { Organization } from './organization.entity';

@Entity({ name: 'threads' })
export class Thread extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'x' })
  x: number;

  @Column({ name: 'y' })
  y: number;

  @Column({ name: 'app_id' })
  appId: string;

  @Column({ name: 'current_version_id' })
  currentVersionId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ default: false, name: 'is_resolved' })
  isResolved: boolean;

  @ManyToOne(() => User, (user) => user.id, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => App, (app) => app.id)
  @JoinColumn({ name: 'app_id' })
  app: App;

  @ManyToOne(() => Organization, (app) => app.id)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;
}
