import { queryManagerSelectComponentStyle } from '../styles';

describe('query manager select styles', () => {
  it('renders portaled menus above App Builder side panels', () => {
    const styles = queryManagerSelectComponentStyle(false);

    expect(styles.menuPortal({ position: 'fixed' })).toEqual({
      position: 'fixed',
      pointerEvents: 'auto',
      zIndex: 2000,
    });
  });
});
