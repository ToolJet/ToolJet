import { Exclude, Expose, plainToInstance } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsUUID,
  IsObject,
  IsOptional,
  ValidateIf,
  NotContains,
  IsNotIn,
  Matches,
  ValidateBy,
} from 'class-validator';
import { LibraryQuery } from '@entities/library_query.entity';
import { LibraryQueryFolder } from '@entities/library_query_folder.entity';
import { DataSource } from '@entities/data_source.entity';

// One library query's options as JSON text. Every saved version keeps a copy, so a draft cannot grow without bound.
export const LIBRARY_OPTIONS_MAX_LENGTH = 1_000_000;
export const MaxJsonLength = (max: number) =>
  ValidateBy({
    name: 'maxJsonLength',
    validator: {
      validate: (value: unknown) => JSON.stringify(value ?? null).length <= max,
      defaultMessage: () => `$property must be at most ${max} characters as JSON`,
    },
  });

export class LibraryFolderDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Matches(/\S/)
  @NotContains('\n')
  name: string;
}
export class CreateLibraryQueryDto extends LibraryFolderDto {
  @IsString()
  @IsNotEmpty()
  @IsNotIn(['runpy', 'workflows', 'library'])
  kind: string;
  @ValidateIf((_object, value) => value !== null)
  @IsUUID()
  dataSourceId: string | null;
  @IsObject()
  @MaxJsonLength(LIBRARY_OPTIONS_MAX_LENGTH)
  options: Record<string, unknown>;
  @IsOptional()
  @IsUUID()
  folderId?: string | null;
}
export class UpdateLibraryQueryDto {
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Matches(/\S/)
  @NotContains('\n')
  name?: string;
  @IsOptional()
  @IsUUID()
  folderId?: string | null;
}
export class ChangeLibraryDataSourceDto {
  @IsUUID()
  dataSourceId: string;
}
@Exclude()
export class LibraryQueryResponseDto {
  @Expose() id: string;
  @Expose() name: string;
  @Expose() folderId: string | null;
  @Expose() createdAt: Date;
  @Expose() updatedAt: Date;
}
@Exclude()
export class LibraryQueryCreatedResponseDto extends LibraryQueryResponseDto {
  @Expose() draftId: string;
}
export const toLibraryQueryCreatedResponse = (
  query: LibraryQuery & { draftId: string }
): LibraryQueryCreatedResponseDto =>
  plainToInstance(LibraryQueryCreatedResponseDto, { ...toLibraryQueryResponse(query), draftId: query.draftId });
@Exclude()
export class LibraryFolderResponseDto {
  @Expose() id: string;
  @Expose() name: string;
  @Expose() createdAt: Date;
  @Expose() updatedAt: Date;
}
export const toLibraryQueryResponse = (query: LibraryQuery): LibraryQueryResponseDto =>
  plainToInstance(LibraryQueryResponseDto, {
    id: query.id,
    name: query.name,
    folderId: query.folderId ?? null,
    createdAt: query.createdAt,
    updatedAt: query.updatedAt,
  });
export const toLibraryFolderResponse = (folder: LibraryQueryFolder): LibraryFolderResponseDto =>
  plainToInstance(LibraryFolderResponseDto, {
    id: folder.id,
    name: folder.name,
    createdAt: folder.createdAt,
    updatedAt: folder.updatedAt,
  });

@Exclude()
export class LibraryStaticDataSourceResponseDto {
  @Expose() id: string;
  @Expose() name: string;
  @Expose() kind: string;
  @Expose() type: string;
}
export const toLibraryStaticDataSourceResponse = (source: DataSource): LibraryStaticDataSourceResponseDto =>
  plainToInstance(LibraryStaticDataSourceResponseDto, {
    id: source.id,
    name: source.name,
    kind: source.kind,
    type: source.type,
  });
