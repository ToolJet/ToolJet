import { accentColour, extractHomeBlocks, renderWireframe, TemplateDefinition } from '@modules/templates/wireframe';

type ComponentInput = {
  id?: string;
  type: string;
  pageId?: string;
  parent?: string | null;
  layout?: { top: number; left: number; width: number; height: number } | null;
  visibility?: string;
  showOnDesktop?: string;
};

function definitionWith(components: ComponentInput[], primary?: { light?: string; dark?: string }): TemplateDefinition {
  return {
    app: [
      {
        definition: {
          appV2: {
            components: components.map((c) => ({
              id: c.id,
              type: c.type,
              pageId: c.pageId ?? 'home',
              parent: c.parent ?? null,
              properties: c.visibility ? { visibility: { value: c.visibility } } : {},
              styles: {},
              displayPreferences: c.showOnDesktop ? { showOnDesktop: { value: c.showOnDesktop } } : {},
              layouts:
                c.layout === null
                  ? []
                  : [{ type: 'desktop', ...(c.layout ?? { top: 0, left: 0, width: 10, height: 40 }) }],
            })),
            appVersions: [
              {
                homePageId: 'home',
                globalSettings: primary ? { theme: { definition: { brand: { colors: { primary } } } } } : {},
              },
            ],
          },
        },
      },
    ],
  };
}

/** @group platform */
describe('templates wireframe', () => {
  describe('extractHomeBlocks', () => {
    it('should keep visible top-level components on the home page, sorted by position', () => {
      const definition = definitionWith([
        { type: 'Table', layout: { top: 200, left: 0, width: 43, height: 400 } },
        { type: 'Button', layout: { top: 40, left: 30, width: 6, height: 40 } },
        { type: 'Text', layout: { top: 40, left: 2, width: 10, height: 30 } },
      ]);

      expect(extractHomeBlocks(definition).map((b) => b.type)).toEqual(['Text', 'Button', 'Table']);
    });

    it('should skip modals, child components, other pages, hidden components and components without a desktop layout', () => {
      const definition = definitionWith([
        { type: 'ModalV2' },
        { type: 'Modal' },
        { type: 'TextInput', parent: 'container-1' },
        { type: 'Chart', pageId: 'other' },
        { type: 'Table', visibility: '{{false}}' },
        { type: 'Table', showOnDesktop: '{{ false }}' },
        { type: 'Button', layout: null },
        { type: 'Container' },
      ]);

      expect(extractHomeBlocks(definition)).toEqual([{ type: 'Container', top: 0, left: 0, width: 10, height: 40 }]);
    });
  });

  describe('extractHomeBlocks children', () => {
    const container = { id: 'c1', type: 'Container', layout: { top: 0, left: 0, width: 43, height: 200 } };

    it('should attach direct children to their top-level parent, sorted by top then left', () => {
      const definition = definitionWith([
        container,
        { type: 'Button', parent: 'c1', layout: { top: 60, left: 2, width: 10, height: 40 } },
        { type: 'Text', parent: 'c1', layout: { top: 20, left: 20, width: 10, height: 20 } },
        { type: 'TextInput', parent: 'c1', layout: { top: 20, left: 2, width: 10, height: 20 } },
      ]);

      const [block] = extractHomeBlocks(definition);

      expect(block.children?.map((c) => c.type)).toEqual(['TextInput', 'Text', 'Button']);
    });

    it('should resolve a container header child through the -header suffix', () => {
      const definition = definitionWith([
        container,
        { type: 'Text', parent: 'c1-header', layout: { top: 4, left: 2, width: 10, height: 20 } },
      ]);

      expect(extractHomeBlocks(definition)[0].children?.map((c) => c.type)).toEqual(['Text']);
    });

    it('should not attach grandchildren', () => {
      const definition = definitionWith([
        container,
        { id: 'l1', type: 'Listview', parent: 'c1', layout: { top: 10, left: 2, width: 39, height: 150 } },
        { type: 'Text', parent: 'l1', layout: { top: 4, left: 0, width: 20, height: 20 } },
      ]);

      expect(extractHomeBlocks(definition)[0].children?.map((c) => c.type)).toEqual(['Listview']);
    });

    it('should attach only the first tab children of a Tabs component', () => {
      const definition = definitionWith([
        { id: 't1', type: 'Tabs', layout: { top: 0, left: 0, width: 43, height: 300 } },
        { type: 'Button', parent: 't1-0', layout: { top: 10, left: 2, width: 10, height: 40 } },
        { type: 'TextInput', parent: 't1-1', layout: { top: 10, left: 2, width: 10, height: 40 } },
        { type: 'Table', parent: 't1-2', layout: { top: 10, left: 2, width: 10, height: 40 } },
      ]);

      expect(extractHomeBlocks(definition)[0].children?.map((c) => c.type)).toEqual(['Button']);
    });

    it('should skip hidden, modal, layout-less and other-page children and parents that are not kept', () => {
      const definition = definitionWith([
        container,
        { id: 'hidden', type: 'Container', visibility: '{{false}}' },
        { type: 'Button', parent: 'c1', visibility: '{{false}}' },
        { type: 'ModalV2', parent: 'c1' },
        { type: 'Text', parent: 'c1', layout: null },
        { type: 'Text', parent: 'c1', pageId: 'other' },
        { type: 'Text', parent: 'hidden' },
      ]);

      const blocks = extractHomeBlocks(definition);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].children).toBeUndefined();
    });
  });

  describe('accentColour', () => {
    it('should return the theme primary colour for each theme', () => {
      const definition = definitionWith([], { light: '#315D91', dark: '#A9CAF5' });

      expect(accentColour(definition, 'light')).toBe('#315D91');
      expect(accentColour(definition, 'dark')).toBe('#A9CAF5');
    });

    it('should fall back when the theme is missing or the value is not a hex colour', () => {
      const fallback = accentColour(definitionWith([]), 'light');

      expect(fallback).toMatch(/^#[0-9A-F]{6}$/i);
      expect(accentColour(definitionWith([], { light: 'var(--primary)' }), 'light')).toBe(fallback);
      expect(accentColour(definitionWith([], { light: '"/><script>' }), 'light')).toBe(fallback);
    });
  });

  describe('renderWireframe', () => {
    const blocks = extractHomeBlocks(
      definitionWith([
        { type: 'Table', layout: { top: 100, left: 0, width: 43, height: 300 } },
        { type: 'Button', layout: { top: 40, left: 30, width: 6, height: 40 } },
      ])
    );

    it('should render one SVG document with the accent header', () => {
      const svg = renderWireframe(blocks, 'light', '#315D91');

      expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true);
      expect(svg.endsWith('</svg>\n')).toBe(true);
      expect(svg).toContain('fill="#315D91"');
    });

    it('should be deterministic', () => {
      expect(renderWireframe(blocks, 'dark', '#A9CAF5')).toBe(renderWireframe(blocks, 'dark', '#A9CAF5'));
    });

    it('should render the header alone when the home page is empty', () => {
      const svg = renderWireframe([], 'light', '#315D91');

      expect(svg).toContain('<rect width="1440" height="48" fill="#315D91"/>');
      expect(svg.endsWith('</svg>\n')).toBe(true);
    });

    it('should draw buttons with the input corner radius, not a pill', () => {
      const svg = renderWireframe(blocks, 'light', '#315D91');

      expect(svg).toContain('<rect x="1005" y="88" width="201" height="40" rx="6" fill="#315D91"/>');
      expect(svg).not.toContain('rx="20"');
    });

    it('should draw a child inside its parent box, scaled to the parent width, on top of the parent', () => {
      const parent = { id: 'c1', type: 'Container', layout: { top: 0, left: 0, width: 43, height: 200 } };
      const child = { type: 'Button', parent: 'c1', layout: { top: 20, left: 2, width: 10, height: 40 } };
      const svg = renderWireframe(extractHomeBlocks(definitionWith([parent, child])), 'light', '#315D91');

      const parentAt = svg.indexOf('<rect x="0" y="48" width="1440" height="200"');
      const childAt = svg.indexOf('<rect x="67" y="68" width="335" height="40" rx="6" fill="#315D91"/>');
      expect(parentAt).toBeGreaterThan(-1);
      expect(childAt).toBeGreaterThan(parentAt);
    });

    it('should clip a child that overhangs its parent and drop one that lies outside it', () => {
      const parent = { id: 'c1', type: 'Container', layout: { top: 0, left: 0, width: 43, height: 100 } };
      const overhang = { type: 'Button', parent: 'c1', layout: { top: 80, left: 2, width: 10, height: 60 } };
      const outside = { type: 'Button', parent: 'c1', layout: { top: 300, left: 2, width: 10, height: 40 } };
      const svg = renderWireframe(extractHomeBlocks(definitionWith([parent, overhang, outside])), 'light', '#315D91');

      const buttons = svg.match(/<rect [^>]*rx="6" fill="#315D91"\/>/g) ?? [];
      expect(buttons).toHaveLength(1);
      const bottom = Number(/y="(\d+)"/.exec(buttons[0])?.[1]) + Number(/height="(\d+)"/.exec(buttons[0])?.[1]);
      expect(bottom).toBeLessThanOrEqual(48 + 100);
    });

    describe('text and table skeletons', () => {
      const MUTED_LIGHT = '#D7DBDF';
      const bars = (svg: string, height: number) =>
        [
          ...svg.matchAll(
            new RegExp(
              `<rect x="(\\d+)" y="(\\d+)" width="(\\d+)" height="${height}" rx="\\d" fill="${MUTED_LIGHT}"/>`,
              'g'
            )
          ),
        ].map((m) => ({ x: Number(m[1]), y: Number(m[2]), w: Number(m[3]) }));
      const render = (components: ComponentInput[]) =>
        renderWireframe(extractHomeBlocks(definitionWith(components)), 'light', '#315D91');

      it('should draw text bars shorter than 70% of the block and never wider than 420px', () => {
        const wide = render([{ type: 'Text', layout: { top: 0, left: 0, width: 43, height: 28 } }]);
        const narrow = render([{ type: 'Text', layout: { top: 0, left: 5, width: 10, height: 28 } }]);

        expect(bars(wide, 10)[0].w).toBeLessThanOrEqual(420);
        expect(bars(narrow, 10)[0].w).toBeLessThanOrEqual(Math.round(0.7 * 10 * (1440 / 43)));
        expect(bars(narrow, 10)[0].w).toBeGreaterThanOrEqual(Math.round(0.35 * 10 * (1440 / 43)));
      });

      it('should draw two bars for a tall text block, the second shorter, and one bar for a short block', () => {
        const tall = bars(render([{ type: 'Text', layout: { top: 0, left: 0, width: 20, height: 60 } }]), 10);
        const short = bars(render([{ type: 'Text', layout: { top: 0, left: 0, width: 20, height: 28 } }]), 10);

        expect(tall).toHaveLength(2);
        expect(tall[1].w).toBeLessThan(tall[0].w);
        expect(Math.abs(tall[1].w - tall[0].w * 0.6)).toBeLessThanOrEqual(1);
        expect(short).toHaveLength(1);
      });

      it('should vary text bar widths between blocks at different positions', () => {
        const widths = [0, 3, 6, 9, 12].map(
          (left) => bars(render([{ type: 'Text', layout: { top: 0, left, width: 10, height: 28 } }]), 10)[0].w
        );

        expect(new Set(widths).size).toBeGreaterThan(1);
      });

      it('should draw a Listview as a panel of at most four stacked row cards, without drawing its children', () => {
        const rowCards = (svg: string) => svg.match(/<rect [^>]*rx="8" fill="#F8F9FA" stroke="#E4E7EB"[^>]*\/>/g) ?? [];
        const listview = (height: number) => ({
          id: 'l1',
          type: 'Listview',
          layout: { top: 0, left: 0, width: 43, height },
        });

        expect(rowCards(render([listview(250)]))).toHaveLength(3);
        expect(rowCards(render([listview(900)]))).toHaveLength(4);
        expect(rowCards(render([listview(40)]))).toHaveLength(0);

        const child = { type: 'Button', parent: 'l1', layout: { top: 20, left: 2, width: 10, height: 40 } };
        const withChild = render([listview(250), child]);
        expect(withChild).toBe(render([listview(250)]));
        expect(withChild).not.toContain('rx="6" fill="#315D91"');
      });

      it('should vary segment widths between table rows', () => {
        const rows = bars(render([{ type: 'Table', layout: { top: 0, left: 0, width: 43, height: 300 } }]), 8);
        const widthsByRow = new Map<number, number[]>();
        rows.forEach((r) => widthsByRow.set(r.y, [...(widthsByRow.get(r.y) ?? []), r.w]));

        expect(widthsByRow.size).toBe(6);
        expect(new Set([...widthsByRow.values()].map((w) => w.join(','))).size).toBeGreaterThan(1);
      });

      it('should draw each table row as three separate cell segments', () => {
        const rows = bars(render([{ type: 'Table', layout: { top: 0, left: 0, width: 43, height: 300 } }]), 8);
        const perRow = new Map<number, number[]>();
        rows.forEach((r) => perRow.set(r.y, [...(perRow.get(r.y) ?? []), r.x]));

        expect(perRow.size).toBeGreaterThan(0);
        [...perRow.values()].forEach((xs) => expect(xs).toHaveLength(3));
        expect(Math.max(...rows.map((r) => r.w))).toBeLessThan(0.5 * 1440);
      });
    });

    it('should use different backgrounds for light and dark', () => {
      expect(renderWireframe([], 'light', '#315D91')).not.toBe(renderWireframe([], 'dark', '#315D91'));
    });
  });
});
