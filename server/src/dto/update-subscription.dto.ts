import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class Item {
  @IsNumber()
  quantity: number;

  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  price: string;
}

export class UpdateSubscriptionDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Item)
  items: Item[];

  @IsNumber()
  prorationDate: number;

  @IsBoolean()
  includeChange: boolean;
}
