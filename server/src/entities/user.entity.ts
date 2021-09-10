import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BeforeInsert, BeforeUpdate, OneToMany, ManyToOne, JoinColumn, AfterLoad, BaseEntity } from 'typeorm';
import { Organization } from './organization.entity';
const bcrypt = require('bcrypt');
import { OrganizationUser } from './organization_user.entity';

@Entity({ name: "users" })
export class User extends BaseEntity {

  @BeforeInsert()
  @BeforeUpdate()
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

  @Column({ name: 'forgot_password_token' })
  forgotPasswordToken: string;

  @Column({ name: 'password_digest' })
  password: string

  @Column({ name: 'organization_id' }) 
  organizationId: string

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;
  
  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => OrganizationUser, organizationUser => organizationUser.user, { eager: true })
  organizationUsers: OrganizationUser[];

  @ManyToOne(() => Organization, organization => organization.id)
  @JoinColumn({ name: "organization_id" })
  organization: Organization;

  public isAdmin;
  public isDeveloper;
  public role;

  @AfterLoad()
  computeUserRole(): void {
    this.isAdmin = this.organizationUsers[0].role === 'admin';
    this.isDeveloper = this.organizationUsers[0].role === 'developer';
    this.role = this.organizationUsers[0].role;
  }

}
