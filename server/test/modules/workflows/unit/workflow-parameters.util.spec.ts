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

  it('should reject missing required workflow inputs for every new-model trigger', () => {
    expect(() =>
      resolveWorkflowParameters({
        workflowInputs: [{ key: 'region', type: 'string', required: true }],
        triggerParams: {},
        trigger: 'manual',
      })
    ).toThrow('Parameter region is required');
  });

  it('should retain legacy webhook validation behavior', () => {
    expect(() =>
      resolveWorkflowParameters({
        legacyDefaultParams: { limit: 10 },
        legacyWebhookParams: [{ key: 'region', dataType: 'string' }],
        triggerParams: {},
        trigger: 'webhook',
      })
    ).toThrow('Params - region is missing');
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

  it('should reject values that do not match the configured type', () => {
    expect(() =>
      resolveWorkflowParameters({
        workflowInputs: [{ key: 'enabled', type: 'boolean', required: false }],
        triggerParams: { enabled: 'true' },
        trigger: 'webhook',
      })
    ).toThrow('enabled has incorrect datatype');
  });
});
