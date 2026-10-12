import { IsOptional, IsUUID } from 'class-validator';

export class CreatePatSessionDto {
  @IsOptional()
  @IsUUID()
  appId?: string;
}
