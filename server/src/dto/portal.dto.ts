import { IsNotEmpty, IsString } from 'class-validator';

export class PortalDto {
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @IsString()
  @IsNotEmpty()
  returnUrl: string;
}
