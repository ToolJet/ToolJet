import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { UserOnboardingDetails } from '@modules/onboarding/types';

@Entity({ name: 'onboarding_details' })
export class OnboardingDetails {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'jsonb', nullable: true, default: {} })
  details: UserOnboardingDetails;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => User, (user) => user.onboardingDetails, { lazy: true })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
