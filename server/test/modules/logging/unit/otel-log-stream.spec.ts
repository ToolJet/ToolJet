import { SeverityNumber } from '@opentelemetry/api-logs';
import { OtelLogStream } from '../../../../src/modules/logging/otel-log-stream';
import { getServerLogger } from '@otel/logs';

jest.mock('@otel/logs', () => ({
  getServerLogger: jest.fn(),
}));

describe('OtelLogStream', () => {
  const mockGetServerLogger = getServerLogger as jest.Mock;
  let stream: OtelLogStream;

  beforeEach(() => {
    jest.clearAllMocks();
    stream = new OtelLogStream();
  });

  describe('when OTEL logging is not configured', () => {
    it('does nothing — getServerLogger returns undefined', () => {
      mockGetServerLogger.mockReturnValue(undefined);

      expect(() => stream.write(JSON.stringify({ level: 'info', msg: 'hello' }))).not.toThrow();
    });
  });

  describe('when a server logger is available', () => {
    let emit: jest.Mock;

    beforeEach(() => {
      emit = jest.fn();
      mockGetServerLogger.mockReturnValue({ emit });
    });

    it('emits the log line as a LogRecord with mapped severity, body, timestamp, and attributes', () => {
      stream.write(
        JSON.stringify({
          level: 'warn',
          msg: 'slow query',
          time: 1700000000000,
          pid: 123,
          hostname: 'box-1',
          route: '/api/apps',
          transactionId: 'tx-1',
        })
      );

      expect(emit).toHaveBeenCalledWith(
        expect.objectContaining({
          severityNumber: SeverityNumber.WARN,
          severityText: 'WARN',
          body: 'slow query',
          timestamp: 1700000000000,
          attributes: { route: '/api/apps', transactionId: 'tx-1' },
        })
      );
    });

    it('strips pid/hostname/time/level/msg out of attributes but keeps trace_id/span_id', () => {
      stream.write(
        JSON.stringify({
          level: 'error',
          msg: 'boom',
          time: 1,
          pid: 1,
          hostname: 'h',
          trace_id: 'abc123',
          span_id: 'def456',
        })
      );

      expect(emit).toHaveBeenCalledWith(
        expect.objectContaining({
          attributes: { trace_id: 'abc123', span_id: 'def456' },
        })
      );
    });

    it.each([
      ['trace', SeverityNumber.TRACE],
      ['debug', SeverityNumber.DEBUG],
      ['info', SeverityNumber.INFO],
      ['warn', SeverityNumber.WARN],
      ['error', SeverityNumber.ERROR],
      ['fatal', SeverityNumber.FATAL],
    ])('maps pino level %s to OTel severity', (level, expected) => {
      stream.write(JSON.stringify({ level, msg: 'x' }));

      expect(emit).toHaveBeenCalledWith(expect.objectContaining({ severityNumber: expected }));
    });

    it('falls back to INFO severity for an unrecognized level', () => {
      stream.write(JSON.stringify({ msg: 'no level field here' }));

      expect(emit).toHaveBeenCalledWith(
        expect.objectContaining({ severityNumber: SeverityNumber.INFO, severityText: 'INFO' })
      );
    });
  });

  describe('malformed input', () => {
    it('ignores a line that is not valid JSON, without throwing', () => {
      mockGetServerLogger.mockReturnValue({ emit: jest.fn() });

      expect(() => stream.write('not json at all')).not.toThrow();
    });
  });
});
