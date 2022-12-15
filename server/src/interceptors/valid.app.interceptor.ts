import {
  ExecutionContext,
  Injectable,
  NotFoundException,
  NestInterceptor,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { AppsService } from 'src/services/apps.service';
import { Observable } from 'rxjs';
import { App } from 'src/entities/app.entity';

@Injectable()
export class ValidAppInterceptor implements NestInterceptor {
  constructor(private appsService: AppsService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const { id, slug } = request.params;
    let app: App;
    if (id) {
      app = await this.appsService.find(id);
      if (!app) throw new NotFoundException('App not found. Invalid app id');
    } else if (slug) {
      app = await this.appsService.findBySlug(slug);
      if (!app) throw new NotFoundException('App not found. Invalid app id');
    } else {
      throw new BadRequestException();
    }

    request.app = app;
    return next.handle();
  }
}
