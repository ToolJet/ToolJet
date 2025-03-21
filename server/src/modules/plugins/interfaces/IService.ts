import { CreatePluginDto, UpdatePluginDto } from '../dto';
import { Plugin } from '@entities/plugin.entity';

export interface IPluginsService {
  install(body: CreatePluginDto): Promise<boolean | any>;
  findAll(): Promise<Plugin[]>;
  findOne(id: string): Promise<Plugin | undefined>;
  update(id: string, body: UpdatePluginDto): Promise<any>;
  remove(id: string): Promise<void>;
  reload(id: string): Promise<Plugin>;
}
