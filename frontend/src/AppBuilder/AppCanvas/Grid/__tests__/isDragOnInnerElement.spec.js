import { isDragOnInnerElement } from '../gridUtils';

// A drag that starts on a widget's own draggable parts (Kanban cards, Table columns, a map) belongs to the widget;
// the canvas must not start moving the whole component from there.
describe('isDragOnInnerElement', () => {
  const widget = (html) => {
    const el = document.createElement('div');
    el.innerHTML = html;
    document.body.appendChild(el);
    return el;
  };

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('treats a drag on a UI 2.0 Kanban card as a card move', () => {
    const el = widget(
      '<div class="board"><div class="column"><div data-tj-inner-drag><p id="title">Card</p></div></div></div>'
    );
    expect(isDragOnInnerElement('ShadKanban', el, el.querySelector('#title'))).toBe(true);
  });

  it('lets a UI 2.0 Kanban move by its frame outside the cards', () => {
    const el = widget('<div class="board"><div class="column" id="column"><div data-tj-inner-drag></div></div></div>');
    expect(isDragOnInnerElement('ShadKanban', el, el.querySelector('#column'))).toBe(false);
  });

  it('honours the inner-drag marker on any widget type', () => {
    const el = widget('<div data-tj-inner-drag><span id="part"></span></div><span id="frame"></span>');
    expect(isDragOnInnerElement('Container', el, el.querySelector('#part'))).toBe(true);
    expect(isDragOnInnerElement('Container', el, el.querySelector('#frame'))).toBe(false);
  });

  it('ignores a marker that belongs to a parent outside the widget', () => {
    const outer = widget('<div id="widget"><span id="part"></span></div>');
    outer.setAttribute('data-tj-inner-drag', '');
    const el = outer.querySelector('#widget');
    expect(isDragOnInnerElement('Container', el, el.querySelector('#part'))).toBe(false);
  });

  it('keeps the classic Kanban card handle and the legacy Kanban Board cards', () => {
    const kanban = widget('<span class="handle-container"><i id="grip"></i></span><div id="body"></div>');
    expect(isDragOnInnerElement('Kanban', kanban, kanban.querySelector('#grip'))).toBe(true);
    expect(isDragOnInnerElement('Kanban', kanban, kanban.querySelector('#body'))).toBe(false);

    const board = widget('<div class="dnd-card"><p id="text"></p></div>');
    expect(isDragOnInnerElement('KanbanBoard', board, board.querySelector('#text'))).toBe(true);
  });

  it('keeps the existing Table and Map inner areas, and is safe when the area is missing', () => {
    const table = widget('<div class="jet-data-table"><span id="th"></span></div>');
    expect(isDragOnInnerElement('Table', table, table.querySelector('#th'))).toBe(true);
    const empty = widget('<div id="x"></div>');
    expect(isDragOnInnerElement('Table', empty, empty.querySelector('#x'))).toBe(false);
    const map = widget('<div class="sc-map-canvas"><canvas id="c"></canvas></div>');
    expect(isDragOnInnerElement('Map', map, map.querySelector('#c'))).toBe(true);
  });
});
