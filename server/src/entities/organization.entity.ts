import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: "organizations" })
export class Organization {

  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column( { name: 'name' } )
  name: string;

  @Column({ name: 'domain' })
  domain: string;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;
  
  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

}
