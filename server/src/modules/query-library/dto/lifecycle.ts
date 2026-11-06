import { Exclude, Expose, Type, plainToInstance } from 'class-transformer';
import { LibraryVersionView, LibraryQueryVersionsView } from '@modules/data-queries/library/library-lifecycle.util';
import { IsString, IsNotEmpty, MaxLength, Matches, IsUUID, IsObject, ValidateIf } from 'class-validator';
import { LIBRARY_OPTIONS_MAX_LENGTH, MaxJsonLength } from './index';

export class SaveLibraryDraftDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(25)
  @Matches(/^[^\s~^:?*[\]\\@{]+$/)
  name: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @MaxLength(500)
  description?: string;
}
export class CreateLibraryDraftDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(25)
  @Matches(/^[^\s~^:?*[\]\\@{]+$/)
  name: string;
  @IsUUID()
  fromVersionId: string;
}
export class UpdateLibraryDraftDto {
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(25)
  @Matches(/^[^\s~^:?*[\]\\@{]+$/)
  name?: string;
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @MaxLength(500)
  description?: string;
  @ValidateIf((_object, value) => value !== undefined)
  @IsObject()
  @MaxJsonLength(LIBRARY_OPTIONS_MAX_LENGTH)
  options?: Record<string, unknown>;
}

@Exclude()
export class LibraryEnvironmentResponseDto {
  @Expose() id: string;
  @Expose() name: string;
  @Expose() priority: number;
}
@Exclude()
export class LibraryDraftResponseDto {
  @Expose() id: string;
  @Expose() name: string;
  @Expose() createdFromVersionId: string | null;
  @Expose() kind: string;
  @Expose() dataSourceId: string | null;
  @Expose() options: Record<string, unknown>;
  @Expose() createdAt: Date;
  @Expose() createdFrom: string | null;
  @Expose() description: string | null;
}
@Exclude()
export class LibraryVersionResponseDto {
  @Expose() createdFromVersionId: string | null;
  @Expose() id: string;
  @Expose() name: string;
  @Expose() versionNumber: number;
  @Expose() description: string | null;
  @Expose() createdFrom: string | null;
  @Expose() @Type(() => LibraryEnvironmentResponseDto) environment: LibraryEnvironmentResponseDto | null;
  @Expose() isReleased: boolean;
  @Expose() createdAt: Date;
  @Expose() kind: string;
  @Expose() dataSourceId: string | null;
  @Expose() options: Record<string, unknown>;
}
@Exclude()
export class LibraryVersionsResponseDto {
  @Expose() @Type(() => LibraryDraftResponseDto) drafts: LibraryDraftResponseDto[];
  @Expose() @Type(() => LibraryVersionResponseDto) versions: LibraryVersionResponseDto[];
  @Expose() nextVersionNumber: number;
}
export const toLibraryVersionResponse = (view: LibraryVersionView): LibraryVersionResponseDto =>
  plainToInstance(LibraryVersionResponseDto, view);
export const toLibraryVersionsResponse = (view: LibraryQueryVersionsView): LibraryVersionsResponseDto =>
  plainToInstance(LibraryVersionsResponseDto, view);

export const toLibraryDraftResponse = (
  view: import('@modules/data-queries/library/library-lifecycle.util').LibraryDraftView
): LibraryDraftResponseDto => plainToInstance(LibraryDraftResponseDto, view);
