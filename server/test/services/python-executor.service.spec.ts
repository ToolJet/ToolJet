import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PythonExecutorService } from '../../ee/workflows/services/python-executor.service';
import { PythonExecutorService as BasePythonExecutorService } from '../../src/modules/workflows/services/python-executor.service';
import { SecurityModeDetectorService } from '../../ee/workflows/services/security-mode-detector.service';
import { SandboxMode } from '../../src/modules/workflows/interfaces/IPythonExecutorService';
import { WorkflowBundle } from '../../src/entities/workflow_bundle.entity';
import { Logger } from 'nestjs-pino';

/**
 * @group workflows
 */
describe('PythonExecutorService', () => {
  describe('Community Edition', () => {
    let ceService: BasePythonExecutorService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [BasePythonExecutorService],
      }).compile();

      ceService = module.get<BasePythonExecutorService>(BasePythonExecutorService);
    });

    it('should throw error for execute() in CE', async () => {
      await expect(ceService.execute('print("hello")', {}, null, 10000)).rejects.toThrow(
        'Python execution is not available in Community Edition'
      );
    });
  });

  describe('Enterprise Edition', () => {
    let service: PythonExecutorService;
    let securityModeDetector: SecurityModeDetectorService;
    let sandboxMode: SandboxMode;

    beforeAll(async () => {
      const mockLogger = {
        log: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      };

      const mockBundleRepository = {
        findOne: jest.fn().mockResolvedValue(null),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          PythonExecutorService,
          SecurityModeDetectorService,
          {
            provide: Logger,
            useValue: mockLogger,
          },
          {
            provide: getRepositoryToken(WorkflowBundle),
            useValue: mockBundleRepository,
          },
        ],
      }).compile();

      service = module.get<PythonExecutorService>(PythonExecutorService);
      securityModeDetector = module.get<SecurityModeDetectorService>(SecurityModeDetectorService);

      await securityModeDetector.onModuleInit();
      sandboxMode = securityModeDetector.getMode();
    });

    describe('sandbox mode detection', () => {
      it('should detect sandbox mode based on environment', () => {
        const mode = securityModeDetector.getMode();
        expect([SandboxMode.ENABLED, SandboxMode.BYPASSED]).toContain(mode);
      });
    });

    describe('.wrapUserCode', () => {
      const stateFile = '/tmp/test/state.json';
      const outputFile = '/tmp/test/output.json';

      it('should wrap code with state injection', () => {
        const wrappedCode = (service as any).wrapUserCode('result = x + 1', stateFile, outputFile);

        expect(wrappedCode).toContain('_state = json.load');
        expect(wrappedCode).toContain('globals().update(_state)');
        expect(wrappedCode).toContain('result = x + 1');
      });

      it('should preserve builtin references', () => {
        const wrappedCode = (service as any).wrapUserCode('result = open', stateFile, outputFile);

        expect(wrappedCode).toContain('_open, _compile, _eval, _exec, _json_dump = open, compile, eval, exec, json.dump');
      });

      it('should use provided file paths', () => {
        const wrappedCode = (service as any).wrapUserCode('result = 42', stateFile, outputFile);

        expect(wrappedCode).toContain("'data': result");
        expect(wrappedCode).toContain(stateFile);
        expect(wrappedCode).toContain(outputFile);
      });

      it('should escape single quotes in user code', () => {
        const wrappedCode = (service as any).wrapUserCode("result = 'hello'", stateFile, outputFile);

        expect(wrappedCode).toContain("\\'hello\\'");
      });
    });

    describe('.execute', () => {
      it('should execute simple code: result = 42', async () => {
        const result = await service.execute('result = 42', {}, null, 10000);

        expect(result.status).toBe('ok');
        expect(result.data).toBe(42);
        expect(result.executionTimeMs).toBeGreaterThan(0);
      }, 15000);

      it('should inject state variables', async () => {
        const result = await service.execute('result = x + y', { x: 10, y: 5 }, null, 10000);

        expect(result.status).toBe('ok');
        expect(result.data).toBe(15);
      }, 15000);

      it('should handle string operations', async () => {
        const result = await service.execute(
          'result = greeting + " " + name',
          { greeting: 'Hello', name: 'World' },
          null,
          10000
        );

        expect(result.status).toBe('ok');
        expect(result.data).toBe('Hello World');
      }, 15000);

      it('should return dict as object', async () => {
        const result = await service.execute('result = {"key": "value", "number": 123}', {}, null, 10000);

        expect(result.status).toBe('ok');
        expect(result.data).toEqual({ key: 'value', number: 123 });
      }, 15000);

      it('should return list as array', async () => {
        const result = await service.execute('result = [1, 2, 3, "four"]', {}, null, 10000);

        expect(result.status).toBe('ok');
        expect(result.data).toEqual([1, 2, 3, 'four']);
      }, 15000);

      it('should handle None as null', async () => {
        const result = await service.execute('result = None', {}, null, 10000);

        expect(result.status).toBe('ok');
        expect(result.data).toBeNull();
      }, 15000);

      it('should handle boolean values', async () => {
        const result = await service.execute('result = x > 5', { x: 10 }, null, 10000);

        expect(result.status).toBe('ok');
        expect(result.data).toBe(true);
      }, 15000);

      it('should handle complex nested structures', async () => {
        const result = await service.execute(
          'result = {"users": [{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}]}',
          {},
          null,
          10000
        );

        expect(result.status).toBe('ok');
        expect(result.data).toEqual({
          users: [
            { name: 'Alice', age: 30 },
            { name: 'Bob', age: 25 },
          ],
        });
      }, 15000);

      it('should handle state that overwrites Python builtins', async () => {
        // State contains "open" and "json" which would overwrite builtins
        // This tests that we correctly save _open and _json_dump before state injection
        const result = await service.execute('result = x + 1', { x: 10, open: 'overwritten', json: 'also overwritten' }, null, 10000);

        // Should still work because we saved _open/_json_dump before globals().update(state)
        expect(result.status).toBe('ok');
        expect(result.data).toBe(11);
      }, 15000);
    });

    describe('error handling', () => {
      it('should handle syntax errors', async () => {
        const result = await service.execute('def invalid(', {}, null, 10000);

        expect(result.status).toBe('error');
        expect(result.error).toBeDefined();
        expect(result.trace).toContain('SyntaxError');
      }, 15000);

      it('should handle runtime errors with traceback', async () => {
        const result = await service.execute('result = undefined_variable', {}, null, 10000);

        expect(result.status).toBe('error');
        expect(result.error).toContain('is not defined');
        expect(result.trace).toContain('NameError');
      }, 15000);

      it('should handle division by zero', async () => {
        const result = await service.execute('result = 10 / 0', {}, null, 10000);

        expect(result.status).toBe('error');
        expect(result.error).toContain('division by zero');
        expect(result.trace).toContain('ZeroDivisionError');
      }, 15000);

      it('should handle type errors', async () => {
        const result = await service.execute('result = "string" + 123', {}, null, 10000);

        expect(result.status).toBe('error');
        expect(result.error).toContain('concatenate');
        expect(result.trace).toContain('TypeError');
      }, 15000);
    });

    describe('Python built-in functions', () => {
      it('should support len()', async () => {
        const result = await service.execute('result = len(items)', { items: [1, 2, 3, 4, 5] }, null, 10000);

        expect(result.status).toBe('ok');
        expect(result.data).toBe(5);
      }, 15000);

      it('should support range() and list()', async () => {
        const result = await service.execute('result = list(range(5))', {}, null, 10000);

        expect(result.status).toBe('ok');
        expect(result.data).toEqual([0, 1, 2, 3, 4]);
      }, 15000);

      it('should support list comprehension', async () => {
        const result = await service.execute('result = [x * 2 for x in numbers]', { numbers: [1, 2, 3] }, null, 10000);

        expect(result.status).toBe('ok');
        expect(result.data).toEqual([2, 4, 6]);
      }, 15000);

      it('should support filter with lambda', async () => {
        const result = await service.execute(
          'result = list(filter(lambda x: x > 2, numbers))',
          { numbers: [1, 2, 3, 4, 5] },
          null,
          10000
        );

        expect(result.status).toBe('ok');
        expect(result.data).toEqual([3, 4, 5]);
      }, 15000);
    });

    describe('.execute - sandbox ENABLED mode (nsjail)', () => {
      // Helper function to skip tests at runtime if sandbox is not enabled
      // Note: Jest doesn't have Jasmine's pending() - tests return early instead
      const skipIfNoNsjail = () => {
        if (sandboxMode !== SandboxMode.ENABLED) {
          return true;
        }
        return false;
      };

      it('should execute code in nsjail sandbox', async () => {
        if (skipIfNoNsjail()) return;

        const result = await service.execute('result = 42', {}, null, 10000);

        expect(result.status).toBe('ok');
        expect(result.data).toBe(42);
      }, 15000);

      it('should use isolated filesystem (sandbox /etc/passwd)', async () => {
        if (skipIfNoNsjail()) return;

        // The sandbox provides a fake /etc/passwd with minimal content
        // This verifies the sandbox mounts are working
        const result = await service.execute(
          `
try:
    with open('/etc/passwd', 'r') as f:
        content = f.read()
    # Sandbox /etc/passwd is small (< 100 bytes), host version is large (> 1000 bytes)
    result = 'sandbox' if len(content) < 200 else 'host'
except FileNotFoundError:
    result = 'sandbox'  # No access is also sandboxed
          `.trim(),
          {},
          null,
          10000
        );

        expect(result.status).toBe('ok');
        expect(result.data).toBe('sandbox');
      }, 15000);

      it('should prevent access to host application files', async () => {
        if (skipIfNoNsjail()) return;

        // The sandbox should not allow access to /app directory
        const result = await service.execute(
          'import os; result = os.path.exists("/app")',
          {},
          null,
          10000
        );

        expect(result.status).toBe('ok');
        expect(result.data).toBe(false);
      }, 15000);
    });
  });
});
