import {
  BadRequestException,
  CallHandler,
  ConflictException,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Observable, from, of, throwError } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';
import { createHash } from 'crypto';
import { isUUID } from 'class-validator';
import { RedisService } from '@modules/redis/service';

export const IDEMPOTENCY_HEADER = 'idempotency-key';
// Pending matches the git org-lease TTL so a crashed pod can't wedge a key; results are replayable for a day.
const PENDING_TTL_SEC = 600;
const DONE_TTL_SEC = 86400;

type Entry = { state: 'pending'; fp: string } | { state: 'done'; fp: string; body: unknown };

// Optional Idempotency-Key support: a retried request with the same key gets the first response
// replayed instead of re-running the handler. Requests without the header are untouched.
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private readonly redisService: RedisService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const idempotencyKey = req.headers[IDEMPOTENCY_HEADER];
    if (idempotencyKey === undefined) return next.handle();
    if (typeof idempotencyKey !== 'string' || !isUUID(idempotencyKey)) {
      throw new BadRequestException('Idempotency-Key must be a UUID');
    }

    const { id: userId, organizationId } = req.user ?? {};
    const key = `tj:idem:${organizationId}:${userId}:${req.method}:${req.route?.path}:${idempotencyKey}`;
    const fp = createHash('sha256')
      .update(JSON.stringify({ params: req.params, query: req.query, body: req.body }))
      .digest('hex');
    const client = this.redisService.getClient();

    return from(this.claim(key, fp)).pipe(
      mergeMap((existing) => {
        if (existing) {
          if (existing.fp !== fp) {
            return throwError(
              () => new UnprocessableEntityException('Idempotency-Key was reused with a different request')
            );
          }
          if (existing.state === 'pending') {
            return throwError(() => new ConflictException('A request with this Idempotency-Key is still in progress'));
          }
          return of(existing.body);
        }
        return next.handle().pipe(
          mergeMap(async (body) => {
            await client.set(key, JSON.stringify({ state: 'done', fp, body }), 'EX', DONE_TTL_SEC);
            return body;
          }),
          catchError((error) => from(client.del(key)).pipe(mergeMap(() => throwError(() => error))))
        );
      })
    );
  }

  // null = we own the key and should run the handler; otherwise the entry another request left.
  private async claim(key: string, fp: string): Promise<Entry | null> {
    const client = this.redisService.getClient();
    const acquired = await client.set(key, JSON.stringify({ state: 'pending', fp }), 'EX', PENDING_TTL_SEC, 'NX');
    if (acquired === 'OK') return null;
    const raw = await client.get(key);
    // expired between SET and GET — try once more to claim it
    return raw ? (JSON.parse(raw) as Entry) : this.claim(key, fp);
  }
}
