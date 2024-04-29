import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ItemDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsOptional()
  quantity: string;

  @IsString()
  @IsNotEmpty()
  interval: string;

  @IsString()
  @IsNotEmpty()
  planId: string;
}

export class ProrationDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  items: ItemDto[];

  @IsBoolean()
  includeChange: boolean;

  @IsNotEmpty()
  prorationDate: number;

  @IsNotEmpty()
  planForm: any;
}
