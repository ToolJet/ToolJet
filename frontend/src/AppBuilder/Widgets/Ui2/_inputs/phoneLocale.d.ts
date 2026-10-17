// The package's exports map gives each locale its types, which moduleResolution "node" does not read: the English
// country names phoneModel uses.
declare module 'react-phone-number-input/locale/en' {
  import type { Labels } from 'react-phone-number-input';

  const labels: Labels;
  export default labels;
}
