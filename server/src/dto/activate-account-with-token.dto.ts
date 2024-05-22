import { IsEmail, IsNotEmpty, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { lowercaseString } from 'src/helpers/utils.helper';
import { Transform } from 'class-transformer';

export class ActivateAccountWithTokenDto {
  @IsEmail()
  @Transform(({ value }) => lowercaseString(value))
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5, { message: 'Password should contain more than 5 letters' })
  @MaxLength(100, { message: 'Password length should be limited to 100' })
  password: string;

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  organizationToken: string;
}
