import { IsInt, IsUUID, IsString } from 'class-validator';

export class CreateCommentDTO {
  @IsString()
  comment: string;

  @IsInt()
  x: number;

  @IsInt()
  y: number;

  // @IsUUID()
  // user: string;
}