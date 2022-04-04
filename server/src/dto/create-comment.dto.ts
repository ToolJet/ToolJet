import { Transform } from 'class-transformer';
import { IsUUID, IsString, IsNotEmpty } from 'class-validator';
import { sanitizeInput } from 'src/helpers/utils.helper';

export class CreateCommentDTO {
  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  @IsNotEmpty()
  comment: string;

  @IsUUID()
  threadId: string;

  @IsUUID()
  userId: string;

  @IsUUID()
  organizationId: string;

  @IsString()
  appVersionsId: string;
}
