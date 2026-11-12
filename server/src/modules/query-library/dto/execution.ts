import { Exclude, Expose, Type, plainToInstance } from 'class-transformer';
import {
  IsObject,
  IsOptional,
  IsUUID,
  ValidateIf,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'libraryRunTarget', async: false })
class LibraryRunTargetConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: import('class-validator').ValidationArguments): boolean {
    const dto = args.object as RunLibraryDraftDto;
    return (dto.draftId !== undefined) !== (dto.libraryVersionId !== undefined);
  }
  defaultMessage(): string {
    return 'Supply exactly one of draftId or libraryVersionId';
  }
}

export class RunLibraryDraftDto {
  @ValidateIf((object, value) => value !== undefined || object.draftId === undefined)
  @IsUUID()
  libraryVersionId?: string;
  @Validate(LibraryRunTargetConstraint)
  @ValidateIf((object, value) => value !== undefined || object.libraryVersionId === undefined)
  @IsUUID()
  draftId?: string;
  @IsOptional()
  @IsObject()
  inputs?: Record<string, unknown>;
  @ValidateIf((_object, value) => value !== undefined)
  @IsObject()
  options?: Record<string, unknown>;
}
@Exclude()
class LibraryInputResponseDto {
  @Expose() name: string;
  @Expose() defaultValue?: unknown;
}
@Exclude()
class LibraryEnvironmentResponseDto {
  @Expose() id: string;
  @Expose() name: string;
  @Expose() priority: number;
}
@Exclude()
class LibraryCatalogDraftResponseDto {
  @Expose() status: 'DRAFT';
  @Expose() id: string;
  @Expose() name: string;
  @Expose() createdAt: Date;
  @Expose() kind: string;
  @Expose() @Type(() => LibraryInputResponseDto) inputs: LibraryInputResponseDto[];
}
@Exclude()
class LibraryCatalogVersionResponseDto {
  @Expose() status: 'PUBLISHED';
  @Expose() id: string;
  @Expose() name: string;
  @Expose() kind: string;
  @Expose() @Type(() => LibraryInputResponseDto) inputs: LibraryInputResponseDto[];
  @Expose() createdAt: Date;
  @Expose() @Type(() => LibraryEnvironmentResponseDto) environment: LibraryEnvironmentResponseDto | null;
  @Expose() isReleased: boolean;
}
@Exclude()
class LibraryCatalogQueryResponseDto {
  @Expose() id: string;
  @Expose() name: string;
  @Expose() folder: string | null;
  @Expose() nextVersionNumber: number;
  @Expose() releasedVersionId: string | null;
  @Expose() @Type(() => LibraryCatalogDraftResponseDto) drafts: LibraryCatalogDraftResponseDto[];
  @Expose() @Type(() => LibraryCatalogVersionResponseDto) versions: LibraryCatalogVersionResponseDto[];
}
@Exclude()
export class LibraryCatalogResponseDto {
  @Expose() @Type(() => LibraryCatalogQueryResponseDto) queries: LibraryCatalogQueryResponseDto[];
}
@Exclude()
class LibraryUsageQueryResponseDto {
  @Expose() libraryQueryVersionId: string;
  @Expose() status: 'DRAFT' | 'PUBLISHED' | 'MISSING';
  @Expose() id: string;
  @Expose() name: string;
  @Expose() appVersionName: string;
  @Expose() libraryQueryId: string;
  @Expose() versionName: string;
  @Expose() pinnedEnvironment: string | null;
}
@Exclude()
class LibraryUsageEntryResponseDto {
  @Expose() id: string;
  @Expose() name: string;
  @Expose() @Type(() => LibraryUsageQueryResponseDto) queries: LibraryUsageQueryResponseDto[];
}
@Exclude()
export class LibraryUsageResponseDto {
  @Expose() @Type(() => LibraryUsageEntryResponseDto) apps: LibraryUsageEntryResponseDto[];
  @Expose() @Type(() => LibraryUsageEntryResponseDto) modules: LibraryUsageEntryResponseDto[];
  @Expose() @Type(() => LibraryUsageEntryResponseDto) workflows: LibraryUsageEntryResponseDto[];
}
@Exclude()
export class LibraryRunResponseDto {
  @Expose() status?: string;
  @Expose() data?: unknown;
  @Expose() metadata?: Record<string, unknown>;
  @Expose() message?: string;
  @Expose() description?: string;
  @Expose() libraryTransformation?: string;
  @Expose() libraryScope?: { input: Record<string, unknown> };
  @Expose() responseHeaders?: Record<string, unknown>;
}
export const toLibraryCatalogResponse = (value: unknown): LibraryCatalogResponseDto =>
  plainToInstance(LibraryCatalogResponseDto, value);
export const toLibraryUsageResponse = (value: unknown): LibraryUsageResponseDto =>
  plainToInstance(LibraryUsageResponseDto, value);
export const toLibraryRunResponse = (value: unknown): LibraryRunResponseDto =>
  plainToInstance(LibraryRunResponseDto, value);
