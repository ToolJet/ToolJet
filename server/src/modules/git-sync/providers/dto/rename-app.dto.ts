import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class RenameAppOrVersionDto {
  @IsString()
  @IsNotEmpty()
  prevName: string;

  @IsString()
  @IsNotEmpty()
  updatedName: string;

  @IsBoolean()
  @IsOptional()
  renameVersionFlag: boolean;

  @IsString()
  @IsOptional()
  remoteName: string;
}
