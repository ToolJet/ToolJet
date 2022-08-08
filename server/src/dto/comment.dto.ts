import { PartialType } from '@nestjs/mapped-types';
import { Transform } from 'class-transformer';
import { IsUUID, IsString, IsNotEmpty, IsOptional, IsDefined } from 'class-validator';
import { sanitizeInput } from 'src/helpers/utils.helper';

export class CreateCommentDto {
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

  @IsDefined()
  mentionedUsers: any;
}

export class UpdateCommentDto extends PartialType(CreateCommentDto) {}
