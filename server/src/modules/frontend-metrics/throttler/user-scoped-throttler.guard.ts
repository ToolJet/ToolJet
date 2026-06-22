import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class UserScopedThrottlerGuard extends ThrottlerGuard {
  // Key by user ID so each authenticated user gets their own rate limit bucket.
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return req.user?.id ?? req.ip;
  }
}
