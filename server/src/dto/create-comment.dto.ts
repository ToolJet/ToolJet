import { IsUUID, IsString } from 'class-validator';

export class CreateCommentDTO {
  @IsString()
  comment: string;

  @IsString()
  tid: string;

  @IsUUID()
  user_id: string;
}
