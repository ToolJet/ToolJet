import { CreatePluginDto, UpdatePluginDto } from '../dto';

export interface IPluginsController {
  install(createPluginDto: CreatePluginDto): Promise<any>;
  findAll(): Promise<any[]>;
  findOne(id: string): Promise<any>;
  update(user: any, id: string, updatePluginDto: UpdatePluginDto): Promise<any>;
  remove(user: any, id: string): Promise<any>;
  reload(id: string): Promise<any>;
}
