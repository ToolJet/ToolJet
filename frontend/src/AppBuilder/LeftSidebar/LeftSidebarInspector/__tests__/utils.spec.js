import { appendPathSegment, copyToClipboard, formatInspectorDataMisc, splitPath } from '../utils';

const copied = () => navigator.clipboard.writeText.mock.calls.at(-1)[0];

beforeEach(() => {
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: jest.fn() } });
});

afterEach(() => {
  delete navigator.clipboard;
});

describe('copyToClipboard', () => {
  // Break this catches: Copy value strips every backslash, so a string with quotes, newlines or a
  // Windows path lands on the clipboard as text that no longer parses back to the value.
  it.each(['He said "hi"', 'line1\nline2\ttab', 'C:\\temp\\new'])(
    'should copy %j as JSON that round-trips',
    (value) => {
      copyToClipboard(value);

      expect(JSON.parse(copied())).toBe(value);
    }
  );

  it('should copy a path as plain text when quotes are off', () => {
    copyToClipboard('variables["v space"]', false);

    expect(copied()).toBe('variables["v space"]');
  });

  // Break this catches: Copy value on a function row (setText, clear, …) throws and copies nothing.
  it('should copy what the pane shows for a function', () => {
    copyToClipboard(() => {});

    expect(copied()).toBe('function');
  });

  it('should copy undefined without throwing', () => {
    copyToClipboard(undefined);

    expect(copied()).toBe('undefined');
  });
});

describe('appendPathSegment', () => {
  it.each([
    ['variables', 'vString', 'variables.vString'],
    ['variables', 'v space', 'variables["v space"]'],
    ['variables', 'v-dash', 'variables["v-dash"]'],
    ['variables', 'v.dot', 'variables["v.dot"]'],
    ['variables', '123num', 'variables["123num"]'],
    ['queries.q1.data', '0', 'queries.q1.data[0]'],
    ['queries.q1.data', 0, 'queries.q1.data[0]'],
    ['variables', 'say "hi"', 'variables["say \\"hi\\""]'],
  ])('should append %j + %j as %s', (path, key, expected) => {
    expect(appendPathSegment(path, key)).toBe(expected);
  });
});

describe('splitPath', () => {
  it('should split a reference path back into its keys', () => {
    expect(splitPath('variables["v.dot"].rows[0]["full name"]')).toEqual([
      'variables',
      'v.dot',
      'rows',
      '0',
      'full name',
    ]);
  });

  it('should split a plain dotted path', () => {
    expect(splitPath('components.button1')).toEqual(['components', 'button1']);
  });
});

describe('formatInspectorDataMisc', () => {
  // Break this catches: a variable named "v space" gets the path variables.v space, which the
  // Inspector then fails to resolve ({{variables.v space}} is not valid JS) and shows "".
  it('should give entries a path that resolves inside {{ }}', () => {
    const [entry] = formatInspectorDataMisc({ 'v space': 'spaced' }, 'variables');

    expect(entry.name).toBe('v space');
    expect(entry.metadata.path).toBe('variables["v space"]');
  });
});
