import { lowercaseString, sanitizeInput } from '@helpers/utils.helper';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class OnboardingCompletedDto {
  @IsString()
  @IsNotEmpty()
  region: string;
}

export class CreateAiUserDto {
  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  name: string;

  @IsEmail()
  @Transform(({ value }) => {
    const newValue = sanitizeInput(value);
    return lowercaseString(newValue);
  })
  email: string;

  @IsString()
  @MinLength(5, { message: 'Password should contain more than 5 letters' })
  password: string;
}
