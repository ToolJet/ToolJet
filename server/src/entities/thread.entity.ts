import { PrimaryGeneratedColumn, BaseEntity, Column, Entity, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'thread' })
export class Thread extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'x' })
  x: number;

  @Column({ name: 'y' })
  y: number;

  @Column({ name: 'app_id' })
  app_id: string;

  @Column({ default: false, name: 'is_resolved' })
  isResolved: boolean;

  @OneToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
