import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class File {
  @PrimaryGeneratedColumn()
  public id: string;

  @Column()
  filename: string;

  @Column({
    type: 'bytea',
  })
  data: any;
}
