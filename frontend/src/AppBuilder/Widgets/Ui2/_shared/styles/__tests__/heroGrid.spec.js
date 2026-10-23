// A hero with an aside lays its text on the left and its primary action top right, with the aside's figure under the
// action. With the actions under the text, a hero with an icon set its button at the icon's edge, about 100px left of
// the text it belongs to, and left the figure alone at the far right (to-do "Today" header, 2026-10-20). jsdom has no
// layout, so the grid is read from the stylesheet.
import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
import fs from 'fs';
import path from 'path';

const SCSS = fs.readFileSync(path.join(__dirname, '../shadcn.scss'), 'utf8');
const rule = (selector) => {
  const at = SCSS.indexOf(`${selector} {`);
  return at < 0 ? '' : SCSS.slice(at, SCSS.indexOf('}', at));
};

describe('[UI2-HERO-GRID] hero with an aside', () => {
  it('puts the actions top right and the aside under them, beside the text', () => {
    const grid = rule('.tj-shadcn .sc-hero-grid');
    expect(grid).toMatch(/grid-template-areas:\s*'text actions'\s*'text aside';/);
    expect(rule('.tj-shadcn .sc-hero-grid > .sc-hero-actions')).toMatch(/justify-self:\s*end/);
  });

  it('centres the aside beside the text when the hero has no actions', () => {
    expect(rule('.tj-shadcn .sc-hero-grid:not(:has(> .sc-hero-actions)) > .sc-hero-aside')).toMatch(/align-self:\s*center/);
  });

  it('stacks text, aside and actions in a narrow hero', () => {
    const narrow = SCSS.slice(SCSS.indexOf('@container (max-width: 560px)'));
    expect(narrow).toMatch(/grid-template-areas:\s*'text'\s*'aside'\s*'actions';/);
  });
});
