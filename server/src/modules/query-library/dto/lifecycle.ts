import { Exclude, Expose, Type, plainToInstance } from 'class-transformer';
import { LibraryVersionView, LibraryQueryVersionsView } from '@modules/data-queries/library/library-lifecycle.util';
export { SaveLibraryVersionDto, CreateLibraryDraftDto } from '@modules/data-queries/dto';
@Exclude()
export class LibraryEnvironmentResponseDto {
  @Expose() id: string;
  @Expose() name: string;
  @Expose() priority: number;
}
@Exclude()
export class LibraryDraftResponseDto {
  @Expose() createdFrom: string | null;
  @Expose() description: string | null;
}
@Exclude()
export class LibraryVersionResponseDto {
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
  @Expose() @Type(() => LibraryDraftResponseDto) draft: LibraryDraftResponseDto | null;
  @Expose() @Type(() => LibraryVersionResponseDto) versions: LibraryVersionResponseDto[];
  @Expose() nextVersionNumber: number;
}
export const toLibraryVersionResponse = (view: LibraryVersionView): LibraryVersionResponseDto =>
  plainToInstance(LibraryVersionResponseDto, view);
export const toLibraryVersionsResponse = (view: LibraryQueryVersionsView): LibraryVersionsResponseDto =>
  plainToInstance(LibraryVersionsResponseDto, view);
