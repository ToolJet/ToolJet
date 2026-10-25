// A status column with no colours set takes its tone from the status word. "On the road" (a fleet app) read as
// neutral in Ant and shadcn, and MUI's DataGrid chips took no tone from words at all; the three packs share one word list.
const shad = require('../../../../../../../packs/shadcn/src/lib/ui2/display/lists/model.ts');
const ant = require('../../../../../../../packs/antd/src/lib/ui2/display/lists/model.ts');
const mui = require('../../../../../../../packs/mui/src/lib/statusTone.ts');

describe.each([
  ['shadcn', shad.chipTone],
  ['antd', ant.chipTone],
  ['mui', mui.chipTone],
])('%s status word tones', (_pack, chipTone) => {
  it('reads in-operation phrases as success', () => {
    for (const w of ['On the road', 'on_duty', 'In operation', 'Operational', 'Running', 'Deployed', 'En route', 'In service'])
      expect(chipTone(w)).toBe('success');
  });
  it('keeps the other tones', () => {
    expect(chipTone('In workshop')).toBe('warning');
    expect(chipTone('Overdue')).toBe('danger');
    expect(chipTone('Out of service')).toBe('danger');
    expect(chipTone('Something else')).toBe('neutral');
  });
});
