import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
export class MenuAppFolderDto {
  @Expose()
  id: string;

  @Expose()
  name: string;
}

@Exclude()
export class MenuAppDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  slug: string;

  // An app sits in at most one folder per branch (uniq_folder_apps_app_branch); null when it has none.
  @Expose()
  @Type(() => MenuAppFolderDto)
  folder: MenuAppFolderDto | null;
}

/** Released apps the current user can open, for the page menu's "All apps" nav item. */
@Exclude()
export class MenuAppsResponseDto {
  @Expose()
  @Type(() => MenuAppDto)
  apps: MenuAppDto[];
}
