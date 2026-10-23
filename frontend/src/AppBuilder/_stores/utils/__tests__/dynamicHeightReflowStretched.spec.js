import { resolveWidgetMeasuredHeight } from '../dynamicHeightReflow';

// A Stat card in an Equal heights row is stretched to the row's tallest child (flexContainer.scss). Measured as drawn,
// it reports the row's height, and the row could then never drop back when the tallest card shrinks. The reflow
// measures it at its own content height and puts the stretch back.
const stretchedStat = ({ ownHeight, rowHeight }) => {
  document.body.innerHTML =
    '<div class="ele-stat flex-child-wrapper flex-stretch-child" data-layout-context="root"></div>';
  const element = document.querySelector('.ele-stat');
  element.style.alignSelf = 'stretch';
  element.style.minHeight = `${rowHeight}px`;
  Object.defineProperty(element, 'offsetParent', { get: () => document.body });
  // jsdom has no layout: drawn stretched, the box is the row's height; released, its own.
  Object.defineProperty(element, 'offsetHeight', {
    get: () => (element.style.alignSelf === 'stretch' ? rowHeight : ownHeight),
  });
  return element;
};

const measure = () =>
  resolveWidgetMeasuredHeight({
    componentId: 'stat',
    currentLayout: 'desktop',
    currentPageComponents: { stat: { layouts: { desktop: { height: 120 } } } },
    temporaryLayouts: {},
    contextIndices: null,
    isContainer: false,
    visibility: true,
  });

describe('measuring a widget stretched by an Equal heights row', () => {
  it('reads its own content height, not the row it is stretched to', () => {
    stretchedStat({ ownHeight: 132, rowHeight: 180 });
    expect(measure()).toBe(132);
  });

  it('puts the stretch back after measuring', () => {
    const element = stretchedStat({ ownHeight: 132, rowHeight: 180 });
    measure();
    expect(element.style.alignSelf).toBe('stretch');
    expect(element.style.minHeight).toBe('180px');
  });

  it('measures any other widget as drawn', () => {
    const element = stretchedStat({ ownHeight: 132, rowHeight: 180 });
    element.classList.remove('flex-stretch-child');
    expect(measure()).toBe(180);
  });
});
