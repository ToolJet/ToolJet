import { footerPlan } from '../_components/Footer/footerPlan';

const base = { look: 'shadcn', pageCount: 1, serverSide: false, editedCount: 0, hasButtons: false };

describe('footerPlan', () => {
  it('drops the footer of a shadcn-look table that fits on one page and has nothing else to show', () => {
    expect(footerPlan(base)).toBe('none');
    expect(footerPlan({ ...base, pageCount: 0 })).toBe('none');
  });

  it('keeps the buttons but drops the pager when a one-page shadcn table has footer buttons', () => {
    expect(footerPlan({ ...base, hasButtons: true })).toBe('noPager');
  });

  it('keeps the full footer with more than one page or server-side paging', () => {
    expect(footerPlan({ ...base, pageCount: 3 })).toBe('full');
    expect(footerPlan({ ...base, serverSide: true })).toBe('full');
    expect(footerPlan({ ...base, editedCount: 2, pageCount: 3 })).toBe('full');
  });

  it('shows the save and discard bar of unsaved edits on one page without a lone pager', () => {
    expect(footerPlan({ ...base, editedCount: 2 })).toBe('noPager');
  });

  it('never changes the ToolJet look', () => {
    expect(footerPlan({ ...base, look: 'default' })).toBe('full');
    expect(footerPlan({ ...base, look: undefined })).toBe('full');
  });
});

describe('table store styles', () => {
  it('keeps the table look, so the footer knows a shadcn-look table', () => {
    const useTableStore = require('../_stores/tableStore').default;
    const store = useTableStore.getState();
    store.initializeComponent('t1');
    store.setTableStyles('t1', { tableLook: 'shadcn' }, false);
    expect(useTableStore.getState().getTableStyles('t1').tableLook).toBe('shadcn');
  });
});
