import { pickRow, nearRow } from '../../../../../../packs/antd/src/lib/chartHighlight';

const ROWS = [{ x: 'Jan' }, { x: 'Feb' }, { x: 'Mar' }];

// G2 reports a line's or area's click with all the series' rows; the clicked row is the nearest vertex.
const click = (points, x, y = 0, tx = 10) => {
  const element = {
    className: 'element',
    __data__: { points },
    getWorldTransform: () => [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, tx, 5, 0, 1],
  };
  return { data: { data: ROWS }, target: { parentNode: { parentNode: element } }, canvas: { x, y } };
};

describe('pickRow', () => {
  it('an area (top edge then bottom edge) gives the row nearest the click', () => {
    const pts = [
      [0, 0],
      [50, 0],
      [100, 0],
      [100, 90],
      [50, 90],
      [0, 90],
    ];
    expect(pickRow(click(pts, 12))).toBe(ROWS[0]);
    expect(pickRow(click(pts, 62))).toBe(ROWS[1]);
    expect(pickRow(click(pts, 108))).toBe(ROWS[2]);
  });

  it('uses y too, for a polar radar', () => {
    const pts = [
      [50, 0],
      [100, 50],
      [50, 100],
    ];
    expect(pickRow(click(pts, 100, 50))).toBe(ROWS[1]);
  });

  it('a cartesian area goes by x alone: a click deep under a peak still gives the peak', () => {
    const pts = [
      [0, 60],
      [50, 0],
      [100, 60],
      [100, 100],
      [50, 100],
      [0, 100],
    ];
    expect(pickRow(click(pts, 60, 90))).toBe(ROWS[1]);
  });

  it('falls back to the first row without vertices, passes a single row through', () => {
    expect(pickRow({ data: { data: ROWS } })).toBe(ROWS[0]);
    expect(pickRow({ data: { data: { x: 'Q1' } } })).toEqual({ x: 'Q1' });
    expect(pickRow({})).toEqual({});
  });
});

// G2's hover circle sits half outside the shape: a click there hits the plot, not the element.
describe('nearRow', () => {
  const view = { className: 'view', __data__: { markState: new Map([[{ key: 'm1', data: ROWS }, {}]]) } };
  const area = {
    className: 'element',
    markType: 'area',
    parentNode: view,
    __data__: {
      markKey: 'm1',
      seriesIndex: [0, 1, 2],
      points: [
        [0, 50],
        [50, 40],
        [100, 50],
        [100, 90],
        [50, 90],
        [0, 90],
      ],
    },
    getWorldTransform: () => [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 5, 0, 1],
  };
  const at = (x, y, target = {}) => ({ target, canvas: { x, y } });

  it('a click just above a vertex gives its row', () => {
    expect(nearRow(at(60, 45 - 4), [area])).toBe(ROWS[1]);
  });
  it('a click far from every vertex gives null', () => {
    expect(nearRow(at(60, 45 - 30), [area])).toBeNull();
  });
  it('a click inside an element is left to element:click', () => {
    expect(nearRow(at(60, 41, { parentNode: area }), [area])).toBeNull();
  });
  it('ignores bars and other marks', () => {
    expect(nearRow(at(60, 41), [{ ...area, markType: 'interval' }])).toBeNull();
  });
});

// A Radar's element is anchored at the radar's centre while its points are in the plot layer's space: the offset to add
// is the layer's, not the element's (PF-234: every click picked the same vertex, and near-misses found none).
describe('a polar Radar: points are offset by the plot layer, not the element', () => {
  const at = (x) => [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, x[0], x[1], 0, 1];
  const layer = { className: 'main-layer', getWorldTransform: () => at([16, 16]) };
  const view = { className: 'view', __data__: { markState: new Map([[{ key: 'r1', data: ROWS }, {}]]) } };
  layer.parentNode = view;
  // Three spokes around a centre at (100, 100) in the layer's space.
  const points = [
    [100, 20],
    [180, 100],
    [100, 180],
  ];
  const radar = {
    className: 'element',
    markType: 'line',
    parentNode: layer,
    __data__: { markKey: 'r1', seriesIndex: [0, 1, 2], points },
    getWorldTransform: () => at([299, 179]),
  };
  const canvas = (p) => ({ x: p[0] + 16, y: p[1] + 16 });

  it('a click on a spoke gives that spoke’s row', () => {
    points.forEach((p, i) => expect(pickRow({ data: { data: ROWS }, target: radar, canvas: canvas(p) })).toBe(ROWS[i]));
  });
  it('a click just beside a spoke’s point counts as that point', () => {
    const near = canvas([180 + 6, 100 - 6]);
    expect(nearRow({ target: {}, canvas: near }, [radar])).toBe(ROWS[1]);
  });
});
