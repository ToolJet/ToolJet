import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: "users" })
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column( { name: 'first_name' } )
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column()
  email: string;

  @Column({ name: 'password_digest' })
  passwordDigest: string

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createAt: Date;
  
  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updateAt: Date;

}
