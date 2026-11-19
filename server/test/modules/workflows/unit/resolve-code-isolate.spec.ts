import * as ivm from 'isolated-vm';
import { resolveCode } from 'lib/utils';

// Records every isolate created, so a test can see whether resolveCode freed the ones it made
jest.mock('isolated-vm', () => {
  const actual = jest.requireActual('isolated-vm');
  const created: unknown[] = [];
  class TrackedIsolate extends actual.Isolate {
    constructor(options?: unknown) {
      super(options);
      created.push(this);
    }
  }
  // Native exports aren't all own-enumerable, so inherit them rather than spread them
  return Object.create(actual, {
    Isolate: { value: TrackedIsolate, enumerable: true },
    __created: { value: created },
  });
});

const created = (ivm as unknown as { __created: ivm.Isolate[] }).__created;

/**
 * resolveCode runs an expression in an isolated-vm sandbox. An isolate it creates for that one
 * evaluation must be freed with it; one the caller passes in is the caller's to free.
 *
 * @group workflows
 */
describe('resolveCode | sandbox isolates', () => {
  beforeEach(() => created.splice(0));

  it('should free the isolate it created and still return the result', () => {
    const result = resolveCode({ code: 'return { sum: a + 1 }', state: { a: 41 } });

    expect(result).toEqual({ sum: 42 });
    expect(created).toHaveLength(1);
    expect(created[0].isDisposed).toBe(true);
  });

  it('should free its isolate when the code throws', () => {
    expect(() => resolveCode({ code: 'throw new Error("boom")', state: {} })).toThrow('boom');
    expect(created[0].isDisposed).toBe(true);
  });

  it("should leave a caller's isolate alive for its next evaluation", () => {
    const isolate = new ivm.Isolate({ memoryLimit: 20 });
    const context = isolate.createContextSync();

    resolveCode({ code: 'return 1', state: {}, isolate, context });

    expect(isolate.isDisposed).toBe(false);
    expect(resolveCode({ code: 'return 2', state: {}, isolate, context })).toBe(2);
    isolate.dispose();
  });
});
