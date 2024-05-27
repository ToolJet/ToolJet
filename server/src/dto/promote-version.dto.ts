import { IsNotEmpty, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeInput } from 'src/helpers/utils.helper';

export class PromoteVersionDto {
  @IsNotEmpty()
  @IsUUID()
  @Transform(({ value }) => sanitizeInput(value))
  currentEnvironmentId: string;
}
