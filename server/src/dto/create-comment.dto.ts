import { Transform } from 'class-transformer';
import { IsUUID, IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { sanitizeInput } from 'src/helpers/utils.helper';

export class CreateCommentDTO {
  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  @IsNotEmpty()
  comment: string;

  @IsUUID()
  threadId: string;

  @IsUUID()
  @IsOptional()
  userId: string;

  @IsUUID()
  @IsOptional()
  organizationId: string;

  @IsString()
  appVersionsId: string;
}
