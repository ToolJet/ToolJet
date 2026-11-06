import { metrics } from '@opentelemetry/api';
import type { Counter } from '@opentelemetry/api';
import { ATTR, METRIC } from './semconv';

export type SignupMethod = 'password' | 'ai_otp' | 'sso';
export type SignupOutcome = 'created' | 'blocked_domain' | 'no_mx' | 'mx_unknown';

let signupsCounter: Counter | undefined;

// Created on first use, not at boot: by the time a signup arrives the SDK has registered its
// MeterProvider. With OTEL off the global provider is a no-op, so this costs nothing.
export const recordSignup = (method: SignupMethod, outcome: SignupOutcome): void => {
  try {
    signupsCounter ??= metrics.getMeter('tooljet-app').createCounter(METRIC.USER_SIGNUPS, {
      description: 'Signup attempts by method and outcome',
      unit: '1',
    });
    signupsCounter.add(1, { [ATTR.SIGNUP_METHOD]: method, [ATTR.SIGNUP_OUTCOME]: outcome });
  } catch {
    // Telemetry never fails a signup.
  }
};
