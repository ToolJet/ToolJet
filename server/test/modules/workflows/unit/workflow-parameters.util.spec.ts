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

  it('should not apply legacy webhook requirements or Test JSON to legacy schedules', () => {
    expect(
      resolveWorkflowParameters({
        legacyDefaultParams: { limit: 10 },
        legacyWebhookParams: [{ key: 'region', dataType: 'string' }],
        triggerParams: {},
        trigger: 'schedule',
      })
    ).toEqual({});
  });

  describe('backward compatibility with legacy webhook parameters', () => {
    const legacy = {
      legacyDefaultParams: { limit: 10 },
      legacyWebhookParams: [{ key: 'orderId', dataType: 'number' as const }],
    };

    it('should treat an empty workflow input list exactly like a legacy workflow', () => {
      expect(
        resolveWorkflowParameters({
          ...legacy,
          workflowInputs: [],
          triggerParams: { orderId: 7, extra: 1 },
          trigger: 'webhook',
        })
      ).toEqual({ orderId: 7 });
      expect(() =>
        resolveWorkflowParameters({ ...legacy, workflowInputs: [], triggerParams: {}, trigger: 'webhook' })
      ).toThrow('Parameter "orderId" is required');
    });

    it('should pass the raw body through for an async legacy webhook, without checks or Test JSON', () => {
      expect(
        resolveWorkflowParameters({ ...legacy, triggerParams: { anything: 'goes' }, trigger: 'webhook-async' })
      ).toEqual({ anything: 'goes' });
    });

    it('should ignore legacy parameter rows with a blank key', () => {
      expect(
        resolveWorkflowParameters({
          legacyWebhookParams: [{ key: '', dataType: 'string' }],
          triggerParams: { x: 1 },
          trigger: 'webhook',
        })
      ).toEqual({});
    });

    it('should resolve legacy parameters and workflow inputs together on a sync webhook', () => {
      expect(
        resolveWorkflowParameters({
          ...legacy,
          workflowInputs: [{ key: 'region', type: 'string', required: true, defaultValue: 'US' }],
          triggerParams: { orderId: 7, region: 'EU', extra: 1 },
          trigger: 'webhook',
        })
      ).toEqual({ orderId: 7, region: 'EU' });
    });

    it('should let a workflow input own a key that is also a legacy parameter', () => {
      expect(
        resolveWorkflowParameters({
          ...legacy,
          workflowInputs: [{ key: 'orderId', type: 'string', required: false, defaultValue: 'A-1' }],
          triggerParams: {},
          trigger: 'webhook',
        })
      ).toEqual({ orderId: 'A-1' });
    });

    it('should keep the legacy Test JSON value for an input that has no value of its own', () => {
      expect(
        resolveWorkflowParameters({
          ...legacy,
          workflowInputs: [{ key: 'limit', type: 'number', required: true }],
          triggerParams: {},
          trigger: 'manual',
        })
      ).toEqual({ limit: 10 });
    });
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
