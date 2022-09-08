import { Injectable, CanActivate, ExecutionContext, HttpException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { App } from 'src/entities/app.entity';
import { Repository } from 'typeorm';
import License from '../configs/License';

@Injectable()
export class AppCountGuard implements CanActivate {
  constructor(
    @InjectRepository(App)
    private appsRepository: Repository<App>
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const license = License.Instance;
    if (license.apps === 'UNLIMITED') {
      return true;
    }

    if ((await this.appsRepository.count()) >= license.apps) {
      throw new HttpException('Maximum application limit reached', 451);
    }
    return true;
  }
}
