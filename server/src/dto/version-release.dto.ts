import { IsNotEmpty, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeInput } from 'src/helpers/utils.helper';

export class VersionReleaseDto {
  @IsNotEmpty()
  @IsUUID()
  @Transform(({ value }) => sanitizeInput(value))
  versionToBeReleased: string;
}
