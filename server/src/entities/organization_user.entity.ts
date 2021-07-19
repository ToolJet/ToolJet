import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from './organization.entity';
import { User } from './user.entity';

@Entity({ name: "organization_users" })
export class OrganizationUser {

  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  role: string;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;
  
  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Organization, organization => organization.id)
  @JoinColumn({ name: "organization_id" })
  organization: Organization;  

  @ManyToOne(() => User, user => user.id)
  @JoinColumn({ name: "user_id" })
  user: User;  

}
