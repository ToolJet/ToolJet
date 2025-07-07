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
export class ValidateWorkflowQuerySourceGuard implements CanActivate {
  constructor(private readonly dataSourceRepository: DataSourcesRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { id } = request.params;
    const { name, kind, data_source_id } = request.body ?? {};
    const user: User = request.user;

    let dataSourceId: string | undefined = data_source_id; 
    const isLoopNode = kind === 'runjs' && name.toLowerCase().includes('loop');

    // id and user are mandatory
    if (!user) {
      throw new ForbiddenException();
    }

    // id or dataSourceId is mandatory
    if (!(id || dataSourceId) && !isLoopNode) {
      throw new BadRequestException();
    }

    let dataSource: DataSource;
    if(isLoopNode) {
      dataSource = await this.dataSourceRepository.getStaticDataSourceByKind(user.organizationId, 'runjs');
    }else if (id) {
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
    request.resource_type = dataSource?.type;

    // Return true to allow the request to proceed
    return true;
  }
}
