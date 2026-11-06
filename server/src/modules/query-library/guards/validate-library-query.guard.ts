import { Injectable, CanActivate, ExecutionContext, NotFoundException } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { QueryLibraryRepository } from '../repository';
@Injectable()
export class ValidateLibraryQueryGuard implements CanActivate {
  constructor(private readonly repository: QueryLibraryRepository) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    if (!isUUID(request.params.id)) throw new NotFoundException('Library query not found');
    const query = await this.repository.findInWorkspace(request.params.id, request.user.organizationId);
    if (!query) throw new NotFoundException('Library query not found');
    request.tj_library_query = query;
    return true;
  }
}
