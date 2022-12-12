import { IsBoolean } from 'class-validator';

export class UpdateCommentUserDto {
  @IsBoolean()
  isRead: boolean;
}
