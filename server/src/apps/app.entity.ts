import { User } from 'src/users/user.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BeforeInsert, BeforeUpdate, ManyToOne, JoinColumn, } from 'typeorm';

@Entity({ name: "apps" })
export class App {

  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column( { name: 'name' } )
  name: string;

  @Column({ name: 'organization_id' }) 
  organizationId: string

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;
  
  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;
  
  @ManyToOne(() => User, user => user.id)
  @JoinColumn({ name: "user_id" })
    user: User;  

}
