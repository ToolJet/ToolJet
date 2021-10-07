import { PrimaryGeneratedColumn, BaseEntity, Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'threads' })
export class Thread extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'x' })
  x: number;

  @Column({ name: 'y' })
  y: number;

  @Column({ name: 'app_id' })
  app_id: string;

  @Column({ name: 'user_id' })
  user_id: string;

  @Column({ default: false, name: 'is_resolved' })
  isResolved: boolean;

  @ManyToOne(() => User, (user) => user.id, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
