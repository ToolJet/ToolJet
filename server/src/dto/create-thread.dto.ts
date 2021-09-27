import { IsInt, IsUUID, IsString } from 'class-validator';

export class CreateThreadDTO {
  @IsInt()
  x: number;

  @IsInt()
  y: number;

  // @IsUUID()
  // user: string;
}
