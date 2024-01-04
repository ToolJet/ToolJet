import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, JoinColumn, BaseEntity, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'user_sessions' })
export class UserSessions extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'device' })
  device: string;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'expiry' })
  expiry: Date;
}
