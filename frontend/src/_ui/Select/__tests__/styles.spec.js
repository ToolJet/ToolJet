import { appBuilderQuerySelectStyle, queryManagerSelectComponentStyle, querySelectStyle } from '../styles';

describe('query manager select styles', () => {
  it('renders portaled menus above App Builder side panels', () => {
    const styles = appBuilderQuerySelectStyle(false);

    expect(styles.menuPortal({ position: 'fixed' })).toEqual({
      position: 'fixed',
      pointerEvents: 'auto',
      zIndex: 2000,
    });
  });

  // Workflow nodes and data-source forms reuse the query editors without a surface and keep main's select.
  it('keeps the shared select outside the App Builder', () => {
    const shared = querySelectStyle(undefined, false);

    expect(shared.menuPortal({})).toEqual(queryManagerSelectComponentStyle(false).menuPortal({}));
    expect(shared.menuPortal({}).zIndex).toBe(999);
    expect(querySelectStyle('right', false).menuPortal({}).zIndex).toBe(2000);
  });
});
