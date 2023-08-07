import { IsString, IsOptional, IsNotEmpty, MaxLength } from 'class-validator';

export class AppCreateDto {
  @IsNotEmpty()
  @MaxLength(50, { message: 'Maximum length has been reached.' })
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  icon?: string;
}
