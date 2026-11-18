import { Injectable } from '@nestjs/common';
import { RedisService } from '@modules/redis/service';

/** A held slot. Renew it before it lapses; release it when the work ends. */
export interface Lease {
  /** False when the lease had already lapsed (and its slot may be someone else's now). */
  renew(): Promise<boolean>;
  release(): Promise<void>;
}

/*
 * Leases on N slots per scope, shared by every pod: a sorted set of holder → expiry (Redis time).
 * A holder that stops renewing (its pod died) drops out once its lease lapses, so slots can't be
 * stuck. All steps are single Lua scripts, so concurrent acquirers never overshoot.
 * The whole key expires a lease length after its last write, so idle scopes leave nothing behind
 * (every lease is the same length, so no member outlives the key).
 */
const NOW_MS = `local t = redis.call('TIME'); local now = tonumber(t[1]) * 1000 + math.floor(tonumber(t[2]) / 1000)`;

// KEYS[1] slots; ARGV: max, leaseMs, holder → 1 acquired (or already held) | 0 full
const ACQUIRE = `
${NOW_MS}
redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', now)
local held = redis.call('ZSCORE', KEYS[1], ARGV[3])
if not held and redis.call('ZCARD', KEYS[1]) >= tonumber(ARGV[1]) then return 0 end
redis.call('ZADD', KEYS[1], now + tonumber(ARGV[2]), ARGV[3])
redis.call('PEXPIRE', KEYS[1], ARGV[2])
return 1
`;

// KEYS[1] slots; ARGV: leaseMs, holder → 1 renewed | 0 lapsed
const RENEW = `
${NOW_MS}
local expiry = redis.call('ZSCORE', KEYS[1], ARGV[2])
if not expiry or tonumber(expiry) <= now then return 0 end
redis.call('ZADD', KEYS[1], now + tonumber(ARGV[1]), ARGV[2])
redis.call('PEXPIRE', KEYS[1], ARGV[1])
return 1
`;

const slotsKey = (scope: string) => `tj:wfslots:{${scope}}`;

@Injectable()
export class ConcurrencyLimiter {
  constructor(private readonly redisService: RedisService) {}

  /** A lease on one of `max` slots of `scope`, or null when all are taken. Throws if Redis fails. */
  async acquire(scope: string, holder: string, max: number, leaseMs: number): Promise<Lease | null> {
    const redis = this.redisService.getClient();
    const key = slotsKey(scope);
    const acquired = (await redis.eval(ACQUIRE, 1, key, max, leaseMs, holder)) === 1;
    if (!acquired) return null;

    return {
      renew: async () => (await redis.eval(RENEW, 1, key, leaseMs, holder)) === 1,
      release: async () => {
        await redis.zrem(key, holder);
      },
    };
  }

  /** Slots of `scope` currently held (lapsed leases excluded). */
  async held(scope: string): Promise<number> {
    const redis = this.redisService.getClient();
    const [seconds] = await redis.time();
    return redis.zcount(slotsKey(scope), `(${Number(seconds) * 1000}`, '+inf');
  }
}
