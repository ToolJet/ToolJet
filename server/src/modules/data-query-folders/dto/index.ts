import { Transform, Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, ValidateNested } from 'class-validator';
import { sanitizeInput } from 'src/helpers/utils.helper';
import { ChildType, DeleteMode } from '../types';

export class CreateFolderDto {
  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9 ]+$/, { message: 'Folder name must be alphanumeric' })
  name: string;

  @IsUUID()
  @IsNotEmpty()
  appVersionId: string;
}

export class RenameFolderDto {
  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9 ]+$/, { message: 'Folder name must be alphanumeric' })
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

export class ReorderItemDto {
  @IsUUID()
  @IsNotEmpty()
  childId: string;

  @IsEnum(ChildType)
  @IsNotEmpty()
  childType: ChildType;

  @IsInt()
  @IsNotEmpty()
  index: number;

  @IsUUID()
  @IsOptional()
  parentId: string | null;
}

export class BatchReorderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDto)
  items: ReorderItemDto[];
}
