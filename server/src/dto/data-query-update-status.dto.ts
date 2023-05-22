import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty } from 'class-validator';
import { sanitizeInput } from 'src/helpers/utils.helper';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateDataQueryStatus {
  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  @IsNotEmpty()
  status: string;
}

export class UpdateDataQueryStatusDto extends PartialType(UpdateDataQueryStatus) {}
