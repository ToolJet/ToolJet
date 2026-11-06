import { ArrayNotEmpty, IsEnum, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ConstantListSort, ConstantSource, OrganizationConstantType } from '../../constants';

// Accepts `source=workspace,env` as well as a repeated `source=workspace&source=env`.
const splitCommaList = ({ value }: { value: unknown }): unknown =>
  value === undefined
    ? value
    : ([] as unknown[])
        .concat(value)
        .flatMap((entry) => String(entry).split(','))
        .map((entry) => entry.trim())
        .filter(Boolean);

export class ListConstantsQueryDto {
  @IsUUID()
  environment_id: string;

  // The active tab: the list returns this type and only counts the other.
  @IsIn([OrganizationConstantType.GLOBAL, OrganizationConstantType.SECRET])
  type: OrganizationConstantType.GLOBAL | OrganizationConstantType.SECRET;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(50)
  search?: string;

  @IsOptional()
  @Transform(splitCommaList)
  @ArrayNotEmpty()
  @IsEnum(ConstantSource, { each: true })
  source: ConstantSource[] = [ConstantSource.WORKSPACE, ConstantSource.ENV];

  @IsOptional()
  @IsEnum(ConstantListSort)
  sort: ConstantListSort = ConstantListSort.NAME_ASC;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  per_page: number = 50;
}
