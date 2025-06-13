import { User } from '@entities/user.entity';
import { AppCreateDto } from '@modules/apps/dto';

export interface IModulesController {
  create(user: User, appCreateDto: AppCreateDto): Promise<any>;
}
