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

  it('keeps the full footer with more than one page, server-side paging or unsaved edits', () => {
    expect(footerPlan({ ...base, pageCount: 3 })).toBe('full');
    expect(footerPlan({ ...base, serverSide: true })).toBe('full');
    expect(footerPlan({ ...base, editedCount: 2 })).toBe('full');
  });

  it('never changes the ToolJet look', () => {
    expect(footerPlan({ ...base, look: 'default' })).toBe('full');
    expect(footerPlan({ ...base, look: undefined })).toBe('full');
  });
});
