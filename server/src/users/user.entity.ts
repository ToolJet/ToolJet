import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: "users" })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column( { name: 'first_name' } )
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column()
  email: string;

  @Column({ name: 'password_digest' })
  passwordDigest: string

  @Column("timestamp", { name: 'created_at' })
  createdAt: Date;

  @Column("timestamp", { name: 'updated_at' })
  updatedAt: Date;

}
