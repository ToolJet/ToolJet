import { encode } from 'js-base64';
import { serializePlugin } from '@modules/data-queries/serialization.helper';

const ICON = encode('<svg><path fill="#181818"/></svg>');
const DARK_ICON = encode('<svg><path fill="#f5f5f5"/></svg>');
const MANIFEST = { source: { name: 'Acme', kind: 'acme', customTesting: true } };

function plugin(files: Record<string, { data: unknown }>) {
  return { id: 'p1', pluginId: 'acme', ...files };
}

describe('serializePlugin', () => {
  it('ships a dark icon as the same base64 text as the icon, read from the database', () => {
    const serialized = serializePlugin(
      plugin({
        iconFile: { data: Buffer.from(ICON) },
        darkIconFile: { data: Buffer.from(DARK_ICON) },
        manifestFile: { data: Buffer.from(encode(JSON.stringify(MANIFEST))) },
      })
    );

    expect(serialized.icon_file.data).toBe(ICON);
    expect(serialized.dark_icon_file.data).toBe(DARK_ICON);
    expect(serialized.manifest_file.data).toEqual(MANIFEST);
  });

  it('keeps a dark icon that was already turned into text', () => {
    const serialized = serializePlugin(
      plugin({ iconFile: { data: ICON }, darkIconFile: { data: DARK_ICON }, manifestFile: { data: MANIFEST } })
    );

    expect(serialized.dark_icon_file.data).toBe(DARK_ICON);
  });

  it('has no dark icon for a plugin that ships none', () => {
    const serialized = serializePlugin(plugin({ iconFile: { data: ICON }, manifestFile: { data: MANIFEST } }));

    expect(serialized.dark_icon_file).toBeUndefined();
    expect(serialized.icon_file.data).toBe(ICON);
  });
});
