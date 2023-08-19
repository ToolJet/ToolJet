import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class AppImportDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(50, { message: 'Maximum length has been reached.' })
  name: string;

  @IsNotEmpty()
  app: object;
}
