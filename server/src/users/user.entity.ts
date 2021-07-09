import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

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

  @Column({ type: 'timestamp', name: 'created_at', default: () => 'LOCALTIMESTAMP' })
  createDate: string;
  
  @Column({ type: 'timestamp', name: 'updated_at', default: () => 'LOCALTIMESTAMP' })
  updateDate: string;

}
