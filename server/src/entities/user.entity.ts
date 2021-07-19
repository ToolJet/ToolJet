import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BeforeInsert, BeforeUpdate, OneToMany } from 'typeorm';
const bcrypt = require('bcrypt');

@Entity({ name: "users" })
export class User {

  @BeforeUpdate()
  @BeforeInsert()
  hashPassword() {
    if (this.password) {
      this.password = bcrypt.hashSync(this.password, 10);
    }
  }

  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column( { name: 'first_name' } )
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column()
  email: string;

  @Column({ name: 'invitation_token' })
  invitationToken: string;

  @Column({ name: 'password_digest' })
  password: string

  @Column({ name: 'organization_id' }) 
  organizationId: string

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;
  
  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

}
