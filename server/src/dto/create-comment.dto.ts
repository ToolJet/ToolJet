import { IsUUID, IsString } from 'class-validator';

export class CreateCommentDTO {
  @IsString()
  comment: string;

  @IsString()
  threadId: string;

  @IsUUID()
  userId: string;
}
