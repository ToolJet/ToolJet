// Text a component draws from a property. useStateString passes typed values through (a Select's choices need
// that), so a binding that resolves to an object or a list of records reached React as a child and threw "Objects
// are not valid as a React child", replacing the widget with an error boundary (pack audit SP-03, 2026-10-23). Such a
// value draws nothing; numbers and booleans draw as text.
export const displayText = (value: unknown): string =>
  value === null || value === undefined || typeof value === 'object' || typeof value === 'function'
    ? ''
    : String(value);
