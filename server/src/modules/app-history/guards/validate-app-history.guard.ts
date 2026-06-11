import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { User } from '@entities/user.entity';
import { AppHistoryRepository } from '@modules/app-history/repository';

@Injectable()
export class ValidateAppHistoryGuard implements CanActivate {
  constructor(private readonly appHistoryRepository: AppHistoryRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { historyId } = request.params;
    const user: User = request.user;

    // Check if historyId is provided, otherwise throw BadRequestException
    if (!historyId) {
      throw new BadRequestException('History ID must be provided');
    }

    // User is mandatory
    if (!user) {
      throw new ForbiddenException();
    }

    // Find the history record with its associated app
    const result = await this.appHistoryRepository.getVersionAndAppIdForHistory(historyId);

    // If history is not found, throw NotFoundException
    if (!result || !result.appId) {
      throw new NotFoundException('App history not found');
    }

    // Attach the found appId to the request
    request.tj_resource_id = result.appId;

    // Return true to allow the request to proceed
    return true;
  }
}
