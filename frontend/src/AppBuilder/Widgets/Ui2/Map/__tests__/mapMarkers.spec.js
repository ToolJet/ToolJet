import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
import { headingOf, mapPoints, markerImageUrl } from '@/AppBuilder/Widgets/Ui2/Map/mapModel';
import { pinIcon } from '@/AppBuilder/Widgets/Ui2/Map/mapIcons';
import { iconSvg, loadIcons } from '@/AppBuilder/Widgets/Ui2/Map/mapLayers';
import {
  IMAGE_SIZES,
  glyphTurn,
  headingOffset,
  markerIcon,
  markerImageFailed,
  markerPopupOffset,
  markerSizeOf,
} from '@/AppBuilder/Widgets/Ui2/Map/mapMarkers';

// Marker options: a heading that turns the icon or image, an image per row in place of the pin, one icon for every pin,
// and three sizes. With none of them set a marker is exactly the pin it was before they existed.

const point = (over = {}) => ({
  key: 'a',
  id: 'a',
  lat: 1,
  lng: 2,
  title: 'A',
  label: '',
  icon: '',
  subtitle: '',
  status: '',
  statusLabel: '',
  tone: '',
  heading: null,
  image: '',
  row: {},
  index: 0,
  ...over,
});
const PIN_SVG =
  '<svg viewBox="0 0 28 36" width="28" height="36" aria-hidden="true"><path class="sc-map-pin-body" d="M14 35s11-11.3 11-21.2A11 11 0 0 0 3 13.8C3 23.7 14 35 14 35z"/>';
const DOT = '<circle class="sc-map-pin-dot" cx="14" cy="13.8" r="4.4"/>';
/** The element Leaflet makes for an icon. */
const drawn = (icon) => icon.createIcon();

describe('marker image URLs', () => {
  it('takes https, http, same-origin paths and image data URIs (SVG included)', () => {
    for (const url of [
      'https://cdn.example.com/van.png',
      'http://fleet.example/bike.svg',
      '/assets/plane.png',
      'img/truck.webp',
      './brand.svg',
      'data:image/png;base64,iVBORw0KGgo=',
      'data:image/jpeg;base64,/9j/4AAQ',
      'data:image/gif;base64,R0lGODlh',
      'data:image/webp;base64,UklGRg==',
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"/>',
      'data:image/svg+xml,%3Csvg%2F%3E',
      'DATA:IMAGE/PNG;base64,iVBORw0KGgo=',
    ]) {
      expect([url, markerImageUrl(url)]).toEqual([url, url]);
    }
    expect(markerImageUrl('  https://cdn.example.com/van.png  ')).toBe('https://cdn.example.com/van.png');
  });

  it('refuses every other scheme, data that is not one of those images, other hosts by //, and junk', () => {
    for (const bad of [
      'javascript:alert(1)',
      'JaVa\tScRiPt:alert(1)',
      ' javascript:alert(1)',
      'vbscript:msgbox(1)',
      'data:text/html,<script>alert(1)</script>',
      'data:application/svg+xml,<svg/>',
      'data:image/x-icon;base64,AAAB',
      'data:image/svg+xmlfoo,<svg/>',
      'data:,hello',
      'blob:https://app.example/1234',
      'file:///etc/passwd',
      'mailto:ops@example.com',
      'ftp://example.com/x.png',
      '//evil.example/x.png',
      '/\\evil.example/x.png',
      '',
      '   ',
      null,
      undefined,
      42,
      { url: 'https://x' },
      ['https://x'],
    ]) {
      expect([bad, markerImageUrl(bad)]).toEqual([bad, '']);
    }
  });
});

describe('marker headings', () => {
  it('reads degrees from numbers and numeric text, clockwise from north, wrapped to 0 to 360', () => {
    expect([0, 90, '45', ' 182.5 ', -90, 450, 360, '-45'].map(headingOf)).toEqual([0, 90, 45, 182.5, 270, 90, 0, 315]);
  });

  it('reads anything else as no heading', () => {
    expect(['', ' ', 'north', '90deg', NaN, Infinity, null, undefined, {}, [], true].map(headingOf)).toEqual(
      Array(11).fill(null)
    );
  });

  it('turns icons that already point north-east (or east) back, so 0 points up', () => {
    for (const name of [
      'navigation',
      'plane',
      'send',
      'rocket',
      'arrow-up-right',
      'Plane',
      'IconPlane',
      'move_up_right',
    ]) {
      expect([name, headingOffset(name)]).toEqual([name, 45]);
    }
    for (const name of ['arrow-right', 'send-horizontal', 'move-right']) {
      expect([name, headingOffset(name)]).toEqual([name, 90]);
    }
    for (const name of ['navigation-2', 'arrow-up', 'car', 'bike', 'truck', '', 'not-an-icon', 7, null]) {
      expect([name, headingOffset(name)]).toEqual([name, 0]);
    }
    expect(glyphTurn(point({ icon: 'plane', heading: 90 }))).toBe(45);
    expect(glyphTurn(point({ icon: 'navigation', heading: 0 }))).toBe(315);
    expect(glyphTurn(point({ icon: 'car', heading: 135 }))).toBe(135);
    expect(glyphTurn(point({ icon: 'car', heading: null }))).toBeNull();
  });
});

describe('marker fields', () => {
  const rows = [
    { id: 1, lat: 1, lng: 2, kind: 'truck', dir: '90', photo: 'https://cdn.example/1.png' },
    { id: 2, lat: 1, lng: 2, kind: '', dir: 'east', photo: 'javascript:alert(1)' },
    { id: 3, lat: 1, lng: 2, dir: -30 },
  ];

  it('reads headingField and imageField per row, unsafe images as none', () => {
    const { points } = mapPoints(rows, { headingField: 'dir', imageField: 'photo' });
    expect(points.map((p) => [p.heading, p.image])).toEqual([
      [90, 'https://cdn.example/1.png'],
      [null, ''],
      [330, ''],
    ]);
  });

  it('gives every pin markerIcon, while a row with its own iconField value keeps it', () => {
    expect(mapPoints(rows, { iconField: 'kind', markerIcon: 'car' }).points.map((p) => p.icon)).toEqual([
      'truck',
      'car',
      'car',
    ]);
    expect(mapPoints(rows, { markerIcon: ' bike ' }).points.map((p) => p.icon)).toEqual(['bike', 'bike', 'bike']);
  });

  it('leaves every option off when unset', () => {
    const { points } = mapPoints(rows, { iconField: '' });
    expect(points.map((p) => [p.icon, p.heading, p.image])).toEqual([
      ['', null, ''],
      ['', null, ''],
      ['', null, ''],
    ]);
    for (const junk of [{}, 7, null, ['x']]) {
      expect(() => mapPoints(rows, { headingField: junk, imageField: junk, markerIcon: junk })).not.toThrow();
    }
  });
});

describe('marker icons', () => {
  beforeAll(() => loadIcons(['zap', 'plane']));

  it('draws exactly the pins it drew before, with every option at its default', () => {
    const cases = [
      [point({ tone: 'success' }), false, null],
      [point({ key: 'b"<', label: '7' }), true, '#e11d48'],
      [point({ label: '$420', tone: 'warning' }), false, null],
      [point({ icon: 'zap' }), false, null],
    ];
    for (const [p, selected, color] of cases) {
      for (const look of [undefined, {}, { size: 'medium' }, { size: 'junk' }]) {
        const icon = markerIcon(p, selected, color, look);
        expect(icon.options).toEqual(pinIcon(p, selected, color).options);
      }
    }
    // The markup and classes, written out: the pins of the release before these options.
    expect(markerIcon(cases[0][0], false, null).options).toMatchObject({
      className: 'sc-map-marker',
      html: `<span class="sc-map-pin" data-marker="a" data-tone="success">${PIN_SVG}${DOT}</svg></span>`,
      iconSize: [28, 36],
      iconAnchor: [14, 35],
    });
    expect(markerIcon(cases[1][0], true, '#e11d48').options.html).toBe(
      `<span class="sc-map-pin" data-marker="b&quot;&lt;" data-selected="true" style="--pin:#e11d48">${PIN_SVG}</svg><span class="sc-map-pin-label">7</span></span>`
    );
    expect(markerIcon(cases[2][0], false, null).options).toMatchObject({
      html: '<span class="sc-map-pill" data-marker="a" data-tone="warning">$420</span>',
      iconSize: [47, 26],
      iconAnchor: [23.5, 32],
    });
    expect(markerIcon(cases[3][0], false, null).options.html).toBe(
      `<span class="sc-map-pin" data-marker="a" data-icon="zap">${PIN_SVG}</svg><span class="sc-map-pin-glyph">${iconSvg(
        'zap'
      )}</span></span>`
    );
    expect(markerPopupOffset(cases[0][0], 'medium')).toEqual([0, -30]);
  });

  it('turns only the glyph to the heading, never the label or the pin', () => {
    const turned = markerIcon(point({ icon: 'plane', heading: 90 }), false, null).options.html;
    expect(turned).toContain(
      `<span class="sc-map-pin-glyph" data-heading="90" style="transform:rotate(45deg)">${iconSvg('plane')}</span>`
    );
    expect(turned).toMatch(/^<span class="sc-map-pin" data-marker="a" data-icon="plane">/);
    // A pin with a label shows the label upright, with no glyph to turn.
    expect(markerIcon(point({ label: '7', heading: 90 }), false, null).options.html).not.toContain('rotate');
    // A price pill turns its icon, not its text.
    const pill = markerIcon(point({ label: '$420', icon: 'plane', heading: 180 }), false, null).options.html;
    expect(pill).toContain('<span class="sc-map-pill-icon" data-heading="180" style="transform:rotate(135deg)">');
    expect(pill).toMatch(/<\/span>\$420<\/span>$/);
  });

  it('sizes pins small, medium (as before) or large', () => {
    expect(['small', 'medium', 'large', 'huge', undefined].map(markerSizeOf)).toEqual([
      'small',
      'medium',
      'large',
      'medium',
      'medium',
    ]);
    const small = markerIcon(point(), false, null, { size: 'small' }).options;
    expect(small).toMatchObject({ iconSize: [22, 28], iconAnchor: [11, 27] });
    expect(small.html).toContain('<span class="sc-map-pin" data-marker="a" data-size="small">');
    expect(small.html).toContain('width="22" height="28"');
    const large = markerIcon(point(), false, null, { size: 'large' }).options;
    expect(large).toMatchObject({ iconSize: [36, 46], iconAnchor: [18, 45] });
    expect(large.html).toContain('width="36" height="46"');
    expect(markerPopupOffset(point(), 'small')[1]).toBeGreaterThan(-30);
    expect(markerPopupOffset(point(), 'large')[1]).toBeLessThan(-30);
    // A price pill is text: it keeps its size.
    expect(markerIcon(point({ label: '$420' }), false, null, { size: 'large' }).options.iconSize).toEqual([47, 26]);
  });
});

describe('image markers', () => {
  const imagePoint = (image, over = {}) => point({ image, ...over });

  it('draws the image as an <img>, sized, centred on the spot, and toned by a ring', () => {
    const url = 'https://cdn.example.com/van.png';
    for (const size of ['small', 'medium', 'large']) {
      const icon = markerIcon(imagePoint(url), false, null, { size });
      const px = IMAGE_SIZES[size];
      expect(icon.options).toMatchObject({
        className: 'sc-map-marker',
        iconSize: [px, px],
        iconAnchor: [px / 2, px / 2],
      });
    }
    expect(IMAGE_SIZES).toEqual({ small: 24, medium: 32, large: 44 });
    const el = drawn(markerIcon(imagePoint(url, { tone: 'danger' }), true, '#dc2626'));
    const box = el.querySelector('.sc-map-image');
    expect(box).toHaveAttribute('data-marker', 'a');
    expect(box).toHaveAttribute('data-tone', 'danger');
    expect(box).toHaveAttribute('data-selected', 'true');
    expect(box).toHaveAttribute('data-ring', 'true');
    expect(box.style.getPropertyValue('--pin')).toBe('#dc2626');
    const img = box.querySelector('img');
    expect(img.getAttribute('src')).toBe(url);
    expect(img).toHaveAttribute('alt', '');
    // Without a status there is no ring.
    expect(drawn(markerIcon(imagePoint(url), false, null)).querySelector('.sc-map-image')).not.toHaveAttribute(
      'data-ring'
    );
    expect(markerPopupOffset(imagePoint(url), 'medium')).toEqual([0, -18]);
  });

  it('turns the image to the heading, its ring and selection staying put', () => {
    const el = drawn(markerIcon(imagePoint('/plane.png', { heading: 270, icon: 'plane' }), false, null));
    expect(el.querySelector('.sc-map-image').style.transform).toBe('');
    expect(el.querySelector('img').style.transform).toBe('rotate(270deg)');
    expect(el.querySelector('img')).toHaveAttribute('data-heading', '270');
  });

  it('never runs or inserts the markup of an SVG data URI holding a script', () => {
    window.__markerScriptRan = false;
    const svg =
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"><script>window.__markerScriptRan=true</script><foreignObject><img src=x onerror="window.__markerScriptRan=true"/></foreignObject></svg>';
    expect(markerImageUrl(svg)).toBe(svg);
    const el = drawn(markerIcon(imagePoint(svg), false, null));
    document.body.appendChild(el);
    try {
      // One wrapper and one image: the SVG's own elements never become nodes.
      expect([...el.querySelectorAll('*')].map((n) => n.tagName)).toEqual(['SPAN', 'IMG']);
      expect(document.querySelector('script, foreignObject, svg script')).toBeNull();
      expect(el.querySelector('img').getAttribute('src')).toBe(svg);
      expect(window.__markerScriptRan).toBe(false);
    } finally {
      el.remove();
      delete window.__markerScriptRan;
    }
  });

  it('falls back to the pin when the image fails to load, and says so once', () => {
    const url = 'https://cdn.example.com/broken-unit.png';
    const failed = jest.fn();
    const el = drawn(markerIcon(imagePoint(url), false, null, { onImageError: failed }));
    expect(markerImageFailed(url)).toBe(false);
    el.querySelector('img').dispatchEvent(new Event('error'));
    el.querySelector('img').dispatchEvent(new Event('error'));
    expect(failed).toHaveBeenCalledTimes(1);
    expect(markerImageFailed(url)).toBe(true);
    // The next drawing is the pin.
    expect(markerIcon(imagePoint(url), false, null).options.html).toMatch(/^<span class="sc-map-pin" data-marker="a">/);
  });
});
