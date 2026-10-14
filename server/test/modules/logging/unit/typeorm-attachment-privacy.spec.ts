import { TypeormLoggerService } from '../../../../src/modules/logging/services/typeorm-logger.service';

describe('TypeORM attachment parameter privacy', () => {
  it('omits embedded originals and buffers from development error and slow-query logs', () => {
    const logger = { error: jest.fn(), warn: jest.fn(), log: jest.fn() };
    const config = { get: (key: string) => key === 'NODE_ENV' ? 'development' : undefined };
    const service = new TypeormLoggerService(logger as any, config as any);
    const parameters = [
      { name: 'synthetic-poster', base64Data: 'private-original-one' },
      JSON.stringify({ jsSchema: { base64Data: 'private-original-two' } }),
      Buffer.from('private-original-three'),
      'data:image/png;base64,private-original-four',
    ];
    service.logQueryError('synthetic failure', 'UPDATE components SET properties = $1', parameters);
    service.logQuerySlow(50, 'UPDATE components SET properties = $1', parameters);
    const output = JSON.stringify([logger.error.mock.calls, logger.warn.mock.calls]);
    expect(output).toContain('synthetic-poster');
    expect(output).toContain('content omitted');
    expect(output).not.toContain('private-original');
    expect(output).not.toContain('112,114,105,118'); // Buffer's serialized bytes must also be absent.
  });
});
