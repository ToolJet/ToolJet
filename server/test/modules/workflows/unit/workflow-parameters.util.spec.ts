/** @group workflows */

import { resolveWorkflowParameters } from '@ee/workflows/services/workflow-parameters.util';

describe('resolveWorkflowParameters', () => {
  it('should merge trigger overrides over workflow input defaults', () => {
    expect(
      resolveWorkflowParameters({
        workflowInputs: [
          { key: 'region', type: 'string', required: true, defaultValue: 'US' },
          { key: 'limit', type: 'number', required: false, defaultValue: 10 },
        ],
        triggerParams: { region: 'EU' },
        trigger: 'schedule',
      })
    ).toEqual({ region: 'EU', limit: 10 });
  });

  it.each([
    ['manual', {}, 'Parameter "region" is required'],
    ['webhook', { region: undefined }, 'Parameter "region" is required'],
    ['schedule', { region: null }, 'Parameter "region" has an incorrect datatype'],
  ] as const)(
    'should reject an absent or invalid required workflow input for the %s trigger',
    (trigger, triggerParams, expectedMessage) => {
      expect(() =>
        resolveWorkflowParameters({
          workflowInputs: [{ key: 'region', type: 'string', required: true }],
          triggerParams,
          trigger,
        })
      ).toThrow(expectedMessage);
    }
  );

  it('should retain legacy webhook validation behavior', () => {
    expect(() =>
      resolveWorkflowParameters({
        legacyDefaultParams: { limit: 10 },
        legacyWebhookParams: [{ key: 'region', dataType: 'string' }],
        triggerParams: {},
        trigger: 'webhook',
      })
    ).toThrow('Parameter "region" is required');
  });

  it('should not apply legacy webhook requirements to schedules or manual runs', () => {
    expect(
      resolveWorkflowParameters({
        legacyDefaultParams: { limit: 10 },
        legacyWebhookParams: [{ key: 'region', dataType: 'string' }],
        triggerParams: {},
        trigger: 'schedule',
      })
    ).toEqual({ limit: 10 });
  });

  it.each(
    (['manual', 'webhook', 'schedule'] as const).flatMap(
      (trigger) =>
        [
          [trigger, 'string', 42],
          [trigger, 'string', false],
          [trigger, 'number', '42'],
          [trigger, 'number', true],
          [trigger, 'boolean', 'true'],
          [trigger, 'boolean', 1],
        ] as const
    )
  )('should reject a %s-triggered %s workflow input supplied as %p', (trigger, type, value) => {
    expect(() =>
      resolveWorkflowParameters({
        workflowInputs: [{ key: 'value', type, required: false }],
        triggerParams: { value },
        trigger,
      })
    ).toThrow('Parameter "value" has an incorrect datatype');
  });

  it.each([
    ['string', 42],
    ['number', '42'],
    ['boolean', 'false'],
  ] as const)('should reject a default value that does not match its configured %s type', (type, defaultValue) => {
    expect(() =>
      resolveWorkflowParameters({
        workflowInputs: [{ key: 'value', type, required: false, defaultValue }],
        triggerParams: {},
        trigger: 'schedule',
      })
    ).toThrow('Parameter "value" has an incorrect datatype');
  });
});
