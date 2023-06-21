import { IsOptional, IsString } from 'class-validator';

export class CustomStylesCreateDto {
  @IsOptional()
  @IsString()
  styles?: string;
}
