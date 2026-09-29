import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Valid JWT attaches the user; missing or invalid JWT proceeds anonymously, never 401. */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    return user;
  }
}
