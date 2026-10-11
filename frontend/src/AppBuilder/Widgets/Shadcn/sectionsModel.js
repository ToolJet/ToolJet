// shadcn/ui pack: the pure logic of the page sections (ShadSections.jsx): the hero's facts and the card grid's cards
// and columns. Every function takes whatever the author bound and never throws.

const isText = (v) => typeof v === 'string' && v.trim() !== '';
const shown = (v) => (v === null || v === undefined ? '' : typeof v === 'object' ? '' : String(v));

/** The hero's facts beside the title: ['Sun, 11 Oct', '14 bookings'], [{ label, value }] or one string with ' · '
 *  between facts. Empty entries are dropped. */
export const heroMeta = (meta) => {
  const list = Array.isArray(meta) ? meta : isText(meta) ? meta.split(/\s+·\s+/) : [];
  return list.flatMap((entry) => {
    if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
      const value = shown(entry.value);
      return value ? [{ ...(isText(entry.label) ? { label: entry.label } : {}), value }] : [];
    }
    const value = shown(entry).trim();
    return value ? [{ value }] : [];
  });
};

/** One meta field: 'prep' shows the value, 'prep:{} min' places it in the label, 'serves:Serves' puts the label first. */
const metaPart = (row, spec) => {
  const [field, label] = spec.split(/:(.*)/s).map((s) => (s ?? '').trim());
  const value = shown(row[field]);
  if (!field || !value) return '';
  if (!label) return value;
  return label.includes('{}') ? label.replace('{}', value) : `${label} ${value}`;
};

const firstTextField = (row) => Object.keys(row).find((k) => isText(row[k]));

/** Cards from rows: title, subtitle, image, description, badge and a meta line, each read from the named field
 *  (metaFields is a comma list joined with ' · '). The title falls back to the first text field. Rows that are not
 *  objects are skipped. */
export const cardItems = (data, fields = {}) => {
  if (!Array.isArray(data)) return [];
  const f = fields || {};
  const metaSpecs = isText(f.metaFields)
    ? f.metaFields
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  return data.flatMap((row, index) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return [];
    const titleKey = isText(f.titleField) && f.titleField in row ? f.titleField : firstTextField(row);
    const id = isText(f.idField) ? row[f.idField] : row.id;
    return [
      {
        key: shown(id) || String(index),
        title: titleKey ? shown(row[titleKey]) : '',
        subtitle: isText(f.subtitleField) ? shown(row[f.subtitleField]) : '',
        image: isText(f.imageField) ? shown(row[f.imageField]) : '',
        description: isText(f.descriptionField) ? shown(row[f.descriptionField]) : '',
        badge: isText(f.badgeField) ? shown(row[f.badgeField]) : '',
        meta: metaSpecs
          .map((spec) => metaPart(row, spec))
          .filter(Boolean)
          .join(' · '),
        row,
      },
    ];
  });
};

/** Columns for a grid this wide: the set count, but never more than fit at the minimum card width; 'auto' (or 0)
 *  fits as many as the width allows. At least one. */
export const gridColumns = (columns, width, minCardWidth = 240) => {
  const min = Math.max(120, Number(minCardWidth) || 240);
  const fit = Math.max(1, Math.floor((Number(width) || 0) / min));
  const set = Math.floor(Number(columns));
  return Number.isFinite(set) && set > 0 ? Math.max(1, Math.min(set, fit)) : fit;
};
