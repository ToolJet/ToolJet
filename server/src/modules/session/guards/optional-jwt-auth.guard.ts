import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT auth that is OPTIONAL: a valid bearer token populates req.user, but a
 * missing/invalid token does not 401 — the route proceeds anonymously. Used by
 * endpoints that accept EITHER a signed-in user OR a bearer secret (e.g. approval resolve).
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    return user; // no throw when user is undefined
  }
}
