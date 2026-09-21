import { IsOptional, IsUUID } from 'class-validator';

export class CreatePatSessionDto {
  /**
   * Mints a session pinned to this ONE app instead of a workspace-wide one, for opening the app in
   * a browser. The app must belong to the token's own workspace.
   *
   * Validated as a UUID here rather than in the service so a malformed id is a 400 from the global
   * ValidationPipe, not a 500 out of the repository lookup.
   */
  @IsOptional()
  @IsUUID()
  appId?: string;
}
