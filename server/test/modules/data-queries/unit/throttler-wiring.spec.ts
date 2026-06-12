import 'reflect-metadata';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { DataQueriesController as EEController } from '@ee/data-queries/controller';
import { DataQueriesController as CEController } from '@modules/data-queries/controller';
import { AppScopedThrottlerGuard } from '@modules/data-queries/throttler/app-scoped-throttler.guard';

function guardsOf(proto: any, method: string): any[] {
  return Reflect.getMetadata(GUARDS_METADATA, proto[method]) || [];
}
const hasThrottler = (proto: any, method: string) =>
  guardsOf(proto, method).some((g) => g === AppScopedThrottlerGuard || g?.name === 'AppScopedThrottlerGuard');

describe('data-query run throttler wiring', () => {
  it('EE editor endpoint (runQueryOnBuilder) has AppScopedThrottlerGuard', () => {
    expect(hasThrottler(EEController.prototype, 'runQueryOnBuilder')).toBe(true);
  });

  it('CE editor endpoint (runQueryOnBuilder) has AppScopedThrottlerGuard', () => {
    expect(hasThrottler(CEController.prototype, 'runQueryOnBuilder')).toBe(true);
  });

  it('CE viewer endpoint (runQuery) has AppScopedThrottlerGuard', () => {
    expect(hasThrottler(CEController.prototype, 'runQuery')).toBe(true);
  });

  it('EE does NOT override the viewer endpoint (inherits base guard)', () => {
    // If EE defined its own runQuery, its guards metadata would exist on EE proto.
    const eeOwn = Object.prototype.hasOwnProperty.call(EEController.prototype, 'runQuery');
    expect(eeOwn).toBe(false);
  });
});
