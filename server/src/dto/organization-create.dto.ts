import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, Validate } from 'class-validator';

import { sanitizeInput } from '../helpers/utils.helper';
import { IsNotExist } from 'src/validators/is-not-exists.validator';

export class OrganizationCreateDto {
  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  @IsNotEmpty()
  @MaxLength(25, { message: 'Name cannot be longer than 25 characters' })
  @Validate(IsNotExist, [
    {
      entityClassOrTableName: 'Organization',
      property: 'name',
      isCaseInsensitive: true,
    },
  ])
  name: string;
}
