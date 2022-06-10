import { PartialType } from '@nestjs/mapped-types';
import { CreatePluginDto } from './create-plugin.dto';

export class UpdatePluginDto extends PartialType(CreatePluginDto) {}
