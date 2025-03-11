import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { User } from '@entities/user.entity';
import { DataSourcesRepository } from '@modules/data-sources/repository';
import { DataSource } from '@entities/data_source.entity';

@Injectable()
export class ValidateQuerySourceGuard implements CanActivate {
  constructor(private readonly dataSourceRepository: DataSourcesRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { id, dataSourceId } = request.params;
    const user: User = request.user;

    // id or dataSourceId is mandatory
    if (!(id || dataSourceId)) {
      throw new BadRequestException();
    }

    // id and user are mandatory
    if (!user) {
      throw new ForbiddenException();
    }

    let dataSource: DataSource;

    if (id) {
      dataSource = await this.dataSourceRepository.findByQuery(id, user.organizationId, dataSourceId);
    } else {
      dataSource = await this.dataSourceRepository.findById(dataSourceId);
    }

    // If app is not found, throw NotFoundException
    if (!dataSource) {
      throw new NotFoundException();
    }

    // Attach the found app to the request
    request.tj_data_source = dataSource;
    request.tj_resource_id = dataSource.id;

    // Return true to allow the request to proceed
    return true;
  }
}
