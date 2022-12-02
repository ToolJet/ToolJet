import { IsNotEmpty, IsString, MaxLength, IsOptional, IsBoolean } from 'class-validator';
import { OrganizationCreateDto } from './organization-create.dto';

export class OrganizationUpdateDto extends OrganizationCreateDto {
  @IsOptional()
  name: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(253, { message: 'domain cannot be longer than 253 characters' })
  domain: string;

  @IsOptional()
  @IsBoolean()
  enableSignUp: boolean;

  @IsOptional()
  @IsBoolean()
  inheritSSO: boolean;
}
