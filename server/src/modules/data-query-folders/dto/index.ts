import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { sanitizeInput } from 'src/helpers/utils.helper';
import { ChildType, DeleteMode } from '../types';

export class CreateFolderDto {
  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  @IsNotEmpty()
  name: string;

  @IsUUID()
  @IsNotEmpty()
  appVersionId: string;
}

export class RenameFolderDto {
  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  @IsNotEmpty()
  name: string;
}

export class DeleteFolderDto {
  @IsEnum(DeleteMode)
  @IsNotEmpty()
  mode: DeleteMode;
}

export class ReorderDto {
  @IsUUID()
  @IsNotEmpty()
  childId: string;

  @IsEnum(ChildType)
  @IsNotEmpty()
  childType: ChildType;

  @IsInt()
  @IsNotEmpty()
  newIndex: number;

  @IsUUID()
  @IsOptional()
  parentId: string | null;
}
