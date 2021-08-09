import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { App } from './app.entity';
import { User } from './user.entity';

@Entity({ name: "app_users" })
export class AppUser {

  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column( { name: 'app_id' } )
  appId: string;

  @Column( { name: 'user_id' } )
  userId: string;

  @Column( { name: 'role' } )
  role: string;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;
  
  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => App, app => app.id)
  @JoinColumn({ name: "app_id" })
  app: App;

  @ManyToOne(() => User, user => user.id)
  @JoinColumn({ name: "user_id" })
  user: User;
  
}
