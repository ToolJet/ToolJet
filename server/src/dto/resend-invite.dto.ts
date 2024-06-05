import { Transform } from 'class-transformer';
import { IsString, IsOptional, IsEmail, IsNotEmpty } from 'class-validator';
import { lowercaseString } from 'src/helpers/utils.helper';

export class ResendInviteDto {
  @IsEmail()
  @Transform(({ value }) => lowercaseString(value))
  @IsNotEmpty()
  email: string;

  @IsOptional()
  @IsString()
  organizationId?: string;

  @IsString()
  @IsOptional()
  redirectTo?: string;
}
