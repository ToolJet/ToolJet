import { Exclude, Expose, Type } from 'class-transformer';
import { IsOptional, IsUUID } from 'class-validator';

export class TemplateDefaultNameQueryDto {
  @IsOptional()
  @IsUUID()
  branchId?: string;
}

@Exclude()
export class TemplateDefaultNameResponseDto {
  @Expose()
  name: string;
}

@Exclude()
export class TemplateSourceResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;
}

@Exclude()
export class TemplateManifestResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  description: string;

  @Expose()
  category: string;

  @Expose()
  features?: string[];

  @Expose()
  @Type(() => TemplateSourceResponseDto)
  sources: TemplateSourceResponseDto[];

  // Not read by the UI today; kept so this change does not narrow the existing response
  @Expose()
  widgets?: string[];
}

@Exclude()
export class TemplateListResponseDto {
  @Expose({ name: 'template_app_manifests' })
  @Type(() => TemplateManifestResponseDto)
  templateAppManifests: TemplateManifestResponseDto[];

  @Expose()
  categories: Record<string, string>;
}
