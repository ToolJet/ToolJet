import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { File } from 'src/entities//file.entity';
import { Organization } from 'src/entities/organization.entity';

@Entity({ name: 'extensions' })
export class Extension {
  @PrimaryGeneratedColumn()
  public id: string;

  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'file_id' })
  fileId: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @JoinColumn({ name: 'file_id' })
  @OneToOne(() => File)
  file?: File;

  @ManyToOne(() => Organization, (organization) => organization.id)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;
}
