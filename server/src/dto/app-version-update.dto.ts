import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeInput } from '../helpers/utils.helper';

export class AppVersionUpdateDto {
  @IsString()
  @IsOptional()
  @Transform(({ value }) => {
    const newValue = sanitizeInput(value);
    return newValue.trim();
  })
  @IsNotEmpty()
  @MaxLength(50, { message: 'Maximum length has been reached.' })
  name: string;

  @IsBoolean()
  @IsOptional()
  showViewerNavigation: boolean;

  @IsString()
  @IsOptional()
  homePageId: string;

  @IsOptional()
  globalSettings: any;
}
