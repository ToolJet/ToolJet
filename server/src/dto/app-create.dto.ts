import { IsString, IsOptional, IsNotEmpty, MaxLength } from 'class-validator';

export class AppCreateDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(50, { message: 'Maximum length has been reached.' })
  name: string;

  @IsString()
  @IsOptional()
  icon?: string;
}
