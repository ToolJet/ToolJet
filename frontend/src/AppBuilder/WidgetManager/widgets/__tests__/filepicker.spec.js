import { filepickerConfig } from '../filepicker';

describe('filepickerConfig', () => {
  test('default height fits the dropzone plus one selected file row without scrolling', () => {
    // 140 was too short: as soon as one file was selected, its row overflowed
    // the fixed-height widget and needed a scroll to see it. See FilePicker.jsx.
    expect(filepickerConfig.defaultSize.height).toBeGreaterThanOrEqual(220);
  });
});
