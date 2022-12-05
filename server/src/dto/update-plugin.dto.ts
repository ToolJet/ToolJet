import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString } from 'class-validator';
import { CreatePluginDto } from './create-plugin.dto';

export class UpdatePluginDto extends PartialType(CreatePluginDto) {
  @IsString()
  @IsOptional()
  pluginId: string;
}
