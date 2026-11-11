import { onceWithDeadline } from '@helpers/bootstrap.helper';

describe('onceWithDeadline', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('should shut down once when the same signal arrives several times', async () => {
    const shutdown = jest.fn().mockResolvedValue(0);
    const exit = jest.fn();
    const onSignal = onceWithDeadline(shutdown, exit, 1000);

    onSignal('SIGTERM');
    onSignal('SIGTERM');
    onSignal('SIGINT');
    await Promise.resolve();
    await Promise.resolve();

    expect(shutdown).toHaveBeenCalledTimes(1);
    expect(shutdown).toHaveBeenCalledWith('SIGTERM');
    expect(exit).toHaveBeenCalledWith(0);
  });

  it('should exit 1 when the shutdown outlasts the deadline', () => {
    const exit = jest.fn();
    const onSignal = onceWithDeadline(() => new Promise<number>(() => undefined), exit, 1000);

    onSignal('SIGTERM');
    jest.advanceTimersByTime(999);
    expect(exit).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);

    expect(exit).toHaveBeenCalledWith(1);
  });

  it('should exit 1 when the shutdown throws', async () => {
    const exit = jest.fn();
    const onSignal = onceWithDeadline(() => Promise.reject(new Error('close failed')), exit, 1000);

    onSignal('SIGTERM');
    await Promise.resolve();
    await Promise.resolve();

    expect(exit).toHaveBeenCalledWith(1);
  });
});
