import { EditorView } from '@codemirror/view';
import { buildScope, clampBounds, mirrorStyles, moveInto, openPanelWindow, windowFeatures } from '../panelWindow';
import { stubWindowOpen } from '@/test/panelWindow';

const otherDocument = () => document.implementation.createHTMLDocument('panel');
const flush = () => Promise.resolve();

const addStyle = (text, attributes = {}) => {
  const style = document.createElement('style');
  style.textContent = text;
  Object.entries(attributes).forEach(([name, value]) => style.setAttribute(name, value));
  document.head.appendChild(style);
  return style;
};

afterEach(() => {
  document.head.replaceChildren();
  document.body.replaceChildren();
  document.documentElement.removeAttribute('class');
  jest.useRealTimers();
});

describe('clampBounds', () => {
  it('uses the default size when nothing is remembered', () => {
    expect(clampBounds(undefined, { availWidth: 1920, availHeight: 1080 })).toEqual({ width: 960, height: 760 });
  });

  it('keeps a remembered size within the screen and above the minimum', () => {
    const screen = { availWidth: 1280, availHeight: 800 };
    expect(clampBounds({ width: 5000, height: 5000 }, screen)).toEqual({ width: 1280, height: 800 });
    expect(clampBounds({ width: 10, height: 10 }, screen)).toEqual({ width: 360, height: 320 });
  });

  it('keeps a position on another monitor as it was, and drops half a position', () => {
    expect(clampBounds({ width: 900, height: 700, left: -1400, top: 60.4 })).toMatchObject({ left: -1400, top: 60 });
    expect(clampBounds({ width: 900, height: 700, left: 40 })).toEqual({ width: 900, height: 700 });
  });
});

describe('windowFeatures', () => {
  it('asks for a separate window of the given size', () => {
    expect(windowFeatures({ width: 900, height: 700 })).toBe('popup=yes,width=900,height=700');
  });

  it('adds the position when there is one', () => {
    expect(windowFeatures({ width: 900, height: 700, left: -1400, top: 60 })).toBe(
      'popup=yes,width=900,height=700,left=-1400,top=60'
    );
  });
});

describe('openPanelWindow', () => {
  it('opens a named, titled, empty window', () => {
    const windows = stubWindowOpen();
    const win = openPanelWindow({ name: 'tj-panel-code', title: 'Code', bounds: { width: 900, height: 700 } });
    expect(windows.open).toHaveBeenCalledWith('', 'tj-panel-code', 'popup=yes,width=900,height=700');
    expect(win).toBe(windows.opened[0]);
    expect(win.document.title).toBe('Code');
    expect(win.document.body.childNodes).toHaveLength(0);
    windows.restore();
  });

  it('gives null when the browser blocks the window', () => {
    const windows = stubWindowOpen();
    windows.block();
    expect(openPanelWindow({ name: 'tj-panel-code', title: 'Code' })).toBeNull();
    windows.restore();
  });
});

describe('mirrorStyles', () => {
  it('copies every stylesheet of the head, in order', () => {
    addStyle('.a { color: red; }', { 'data-from': 'first' });
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.setAttribute('href', '/assets/main.css');
    document.head.appendChild(link);
    addStyle('.b { color: blue; }');
    const target = otherDocument();

    const stop = mirrorStyles(document, target);

    const copies = Array.from(target.head.querySelectorAll('style, link'));
    expect(copies.map((el) => el.localName)).toEqual(['style', 'link', 'style']);
    expect(copies[0].textContent).toBe('.a { color: red; }');
    expect(copies[0].getAttribute('data-from')).toBe('first');
    // The resolved address: a relative one would depend on the other page's base.
    expect(copies[1].getAttribute('href')).toBe('http://localhost/assets/main.css');
    expect(copies[2].textContent).toBe('.b { color: blue; }');
    stop();
  });

  it('leaves what the window put in its own head where it is', () => {
    addStyle('.a {}');
    const target = otherDocument();
    const own = target.createElement('style');
    own.textContent = '.own {}';
    target.head.appendChild(own);

    const stop = mirrorStyles(document, target);

    expect(target.head.contains(own)).toBe(true);
    expect(target.head.firstElementChild.localName).toBe('title');
    stop();
  });

  it('follows stylesheets added, changed and removed later', async () => {
    const first = addStyle('.a {}');
    const last = addStyle('.z {}');
    const target = otherDocument();
    const stop = mirrorStyles(document, target);
    const texts = () => Array.from(target.head.querySelectorAll('style'), (el) => el.textContent);

    const middle = document.createElement('style');
    middle.textContent = '.m {}';
    document.head.insertBefore(middle, last);
    await flush();
    expect(texts()).toEqual(['.a {}', '.m {}', '.z {}']);

    first.textContent = '.a { color: green; }';
    await flush();
    expect(texts()).toEqual(['.a { color: green; }', '.m {}', '.z {}']);

    middle.remove();
    await flush();
    expect(texts()).toEqual(['.a { color: green; }', '.z {}']);
    stop();
  });

  it('copies rules that were inserted through the CSSOM, now and as more arrive', () => {
    jest.useFakeTimers();
    const style = addStyle('');
    style.sheet.insertRule('.inserted { color: red; }');
    const target = otherDocument();

    const stop = mirrorStyles(document, target);
    const copy = target.head.querySelector('style');
    expect(copy.textContent).toContain('.inserted');

    style.sheet.insertRule('.later { color: blue; }');
    jest.advanceTimersByTime(500);
    expect(copy.textContent).toContain('.later');
    stop();
  });

  it("gives the window the root element's class and follows it", async () => {
    document.documentElement.className = 'theme-a';
    const target = otherDocument();
    const stop = mirrorStyles(document, target);
    expect(target.documentElement.className).toBe('theme-a');

    document.documentElement.className = 'theme-b';
    await flush();
    expect(target.documentElement.className).toBe('theme-b');
    stop();
  });

  it('stops following once stopped', async () => {
    const target = otherDocument();
    const stop = mirrorStyles(document, target);
    stop();
    addStyle('.late {}');
    await flush();
    expect(target.head.querySelector('style')).toBeNull();
  });
});

describe('buildScope', () => {
  it('wraps the panel in one element per scope entry, outermost first', () => {
    const target = otherDocument();
    const { mount } = buildScope(target, ['wrapper editor', 'editor-sidebar theme-dark']);
    expect(mount.className).toBe('tj-popout-scope editor-sidebar theme-dark');
    expect(mount.parentElement.className).toBe('tj-popout-scope wrapper editor');
    expect(mount.parentElement.parentElement).toBe(target.body);
  });

  it('mounts straight in the body without a scope', () => {
    const target = otherDocument();
    expect(buildScope(target).mount).toBe(target.body);
  });

  it('changes the class names in place', () => {
    const target = otherDocument();
    const { mount, update } = buildScope(target, ['editor-sidebar']);
    update(['editor-sidebar theme-dark']);
    expect(mount.className).toBe('tj-popout-scope editor-sidebar theme-dark');
    expect(target.body.querySelectorAll('.tj-popout-scope')).toHaveLength(1);
  });
});

describe('moveInto', () => {
  it('moves the element, with its content, into another document', () => {
    const host = document.createElement('div');
    host.innerHTML = '<input value="kept" />';
    document.body.appendChild(host);
    const input = host.querySelector('input');
    const target = otherDocument();

    moveInto(host, target.body);

    expect(host.ownerDocument).toBe(target);
    expect(target.body.querySelector('input')).toBe(input);
    expect(document.body.contains(host)).toBe(false);
  });

  it('puts scroll offsets back after the move', () => {
    const host = document.createElement('div');
    const scroller = document.createElement('div');
    host.appendChild(scroller);
    document.body.appendChild(host);
    scroller.scrollTop = 240;
    scroller.scrollLeft = 12;
    const target = otherDocument();
    // A move resets them in a browser; jsdom keeps them, so reset them the same way to see them restored.
    const append = target.body.appendChild.bind(target.body);
    target.body.appendChild = (node) => {
      const moved = append(node);
      scroller.scrollTop = 0;
      scroller.scrollLeft = 0;
      return moved;
    };

    moveInto(host, target.body);

    expect(scroller.scrollTop).toBe(240);
    expect(scroller.scrollLeft).toBe(12);
  });

  it('tells CodeMirror editors which document they are in now', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const view = new EditorView({ parent: host, doc: 'const a = 1;' });
    expect(view.root).toBe(document);
    const target = otherDocument();

    moveInto(host, target.body);

    expect(view.root).toBe(target);
    view.destroy();
  });

  it('does nothing when the element is already there', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const append = jest.spyOn(document.body, 'appendChild');
    moveInto(host, document.body);
    expect(append).not.toHaveBeenCalled();
    append.mockRestore();
  });
});
