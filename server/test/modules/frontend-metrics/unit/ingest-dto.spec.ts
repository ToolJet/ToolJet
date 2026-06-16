/**
 * DTO validation tests for IngestFrontendMetricsDto and FrontendMetricEventDto
 *
 * Tests class-validator rules directly — no NestJS HTTP layer or DB needed.
 * These rules are the server's defence against malformed/malicious payloads.
 *
 * Run: cd server && npx jest test/modules/frontend-metrics
 */

import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { IngestFrontendMetricsDto, FrontendMetricEventDto } from '@modules/frontend-metrics/dto/ingest.dto';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Recursively collect all constraint messages (handles nested ValidateNested errors) */
function collectMessages(errors: ValidationError[]): string[] {
  const messages: string[] = [];
  for (const error of errors) {
    if (error.constraints) {
      messages.push(...Object.values(error.constraints));
    }
    if (error.children && error.children.length > 0) {
      messages.push(...collectMessages(error.children));
    }
  }
  return messages;
}

async function validateDto(plain: object): Promise<string[]> {
  const dto = plainToInstance(IngestFrontendMetricsDto, plain);
  const errors = await validate(dto, { whitelist: true });
  return collectMessages(errors);
}

async function validateEvent(plain: object): Promise<string[]> {
  const dto = plainToInstance(FrontendMetricEventDto, plain);
  const errors = await validate(dto, { whitelist: true });
  return collectMessages(errors);
}

function validBatch(overrides: object = {}): object {
  return {
    collected_at: new Date().toISOString(),
    events: [
      { type: 'page_view', ts: Date.now(), attrs: { page: 'dashboard' } },
    ],
    ...overrides,
  };
}

function validEvent(overrides: object = {}): object {
  return { type: 'page_view', ts: Date.now(), attrs: {}, ...overrides };
}

// ── IngestFrontendMetricsDto ──────────────────────────────────────────────────

describe('IngestFrontendMetricsDto validation', () => {
  it('accepts a valid batch with all required fields', async () => {
    expect(await validateDto(validBatch())).toHaveLength(0);
  });

  it('rejects when collected_at is missing', async () => {
    const errors = await validateDto({ events: [] });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects when collected_at exceeds 50 characters', async () => {
    const errors = await validateDto(validBatch({ collected_at: 'x'.repeat(51) }));
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects when events array exceeds 200 items (@ArrayMaxSize)', async () => {
    const events = Array.from({ length: 201 }, () => validEvent());
    const errors = await validateDto(validBatch({ events }));
    // class-validator message: "events must contain no more than 200 elements"
    expect(errors.some((msg) => msg.includes('200'))).toBe(true);
  });

  it('accepts events array with exactly 200 items', async () => {
    const events = Array.from({ length: 200 }, () => validEvent());
    expect(await validateDto(validBatch({ events }))).toHaveLength(0);
  });

  it('accepts an empty events array', async () => {
    expect(await validateDto(validBatch({ events: [] }))).toHaveLength(0);
  });

  it('propagates nested event validation errors (@ValidateNested)', async () => {
    const errors = await validateDto(
      validBatch({ events: [{ type: 'UNKNOWN_TYPE', ts: Date.now(), attrs: {} }] })
    );
    expect(errors.length).toBeGreaterThan(0);
  });
});

// ── FrontendMetricEventDto ────────────────────────────────────────────────────

describe('FrontendMetricEventDto validation', () => {
  const validTypes = [
    'page_view', 'page_load', 'app_open', 'app_load',
    'query_exec', 'query_error', 'widget_render', 'widget_error', 'js_error',
  ];

  it.each(validTypes)('accepts valid event type "%s"', async (type) => {
    expect(await validateEvent(validEvent({ type }))).toHaveLength(0);
  });

  it('rejects unknown event type', async () => {
    expect(await validateEvent(validEvent({ type: 'UNKNOWN_EVENT' }))).toHaveLength(1);
  });

  it('rejects empty string event type', async () => {
    expect(await validateEvent(validEvent({ type: '' }))).toHaveLength(1);
  });

  it('rejects when type field is missing', async () => {
    const { type, ...withoutType } = validEvent() as any;
    expect(await validateEvent(withoutType)).toHaveLength(1);
  });

  it('rejects negative ts value (@Min(0))', async () => {
    expect(await validateEvent(validEvent({ ts: -1 }))).toHaveLength(1);
  });

  it('accepts ts value of 0', async () => {
    expect(await validateEvent(validEvent({ ts: 0 }))).toHaveLength(0);
  });

  it('accepts when duration is omitted (@IsOptional)', async () => {
    expect(await validateEvent(validEvent())).toHaveLength(0);
  });

  it('accepts duration of 0 (cache-hit scenario)', async () => {
    expect(await validateEvent(validEvent({ duration: 0 }))).toHaveLength(0);
  });

  it('rejects negative duration (@Min(0))', async () => {
    expect(await validateEvent(validEvent({ duration: -1 }))).toHaveLength(1);
  });

  it('accepts a valid positive duration in milliseconds', async () => {
    expect(await validateEvent(validEvent({ duration: 1234 }))).toHaveLength(0);
  });

  it('rejects when attrs field is missing', async () => {
    const { attrs, ...withoutAttrs } = validEvent() as any;
    expect(await validateEvent(withoutAttrs)).toHaveLength(1);
  });

  it('accepts attrs with mixed string/number/boolean values', async () => {
    expect(
      await validateEvent(validEvent({ attrs: { page: 'dashboard', app_id: 'uuid-1' } }))
    ).toHaveLength(0);
  });
});
