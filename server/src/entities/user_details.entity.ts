import {
  Entity,
  Unique,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Organization } from './organization.entity';
import { MaxLength } from 'class-validator';

@Entity({ name: 'user_details' })
@Unique(['organizationId', 'userId'])
export class UserDetails {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', unique: true })
  userId: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ type: 'json', name: 'sso_user_info' })
  ssoUserInfo: any;

  @Column({ type: 'varchar', name: 'user_metadata', nullable: true })
  @MaxLength(30000)
  userMetadata: string;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.userDetails)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Organization, (organization) => organization.userDetails)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;
}
