import { copyToClipboard } from '../utils';
import { toast } from 'react-hot-toast';

jest.mock('react-hot-toast', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

describe('copyToClipboard', () => {
  const writeText = jest.fn();
  const previous = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  });
  afterEach(() => {
    if (previous) Object.defineProperty(navigator, 'clipboard', previous);
    else delete navigator.clipboard;
  });

  it('copies query source verbatim and keeps structured debugger values valid JSON', async () => {
    const code = 'def caption():\n    return r"north\\s+wing"\n\ncaption()';
    await copyToClipboard(code);
    expect(writeText).toHaveBeenLastCalledWith(code);
    const log = { code, details: ['a"b', 'x\ty'] };
    await copyToClipboard(log);
    expect(JSON.parse(writeText.mock.calls[1][0])).toEqual(log);
  });

  it('copies an inspector function as text and reports a rejected copy', async () => {
    const click = () => 8;
    await copyToClipboard(click);
    expect(writeText).toHaveBeenLastCalledWith(String(click));
    expect(toast.success).toHaveBeenCalledTimes(1);
    writeText.mockRejectedValueOnce(new Error('Clipboard unavailable'));
    await copyToClipboard('shelf');
    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledTimes(1);
  });
});
