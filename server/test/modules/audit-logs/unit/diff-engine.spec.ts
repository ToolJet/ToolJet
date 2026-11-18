/** @group platform */
import { diffSnapshots } from '@modules/audit-logs/events/diff-engine';
import { FieldSpec } from '@modules/audit-logs/events/types';

const FIELDS: FieldSpec = { name: 'plain', slug: 'plain', default: 'plain', secret: 'sensitive' };

describe('diffSnapshots', () => {
  it('should record every field from null when the resource is created', () => {
    expect(diffSnapshots(null, { name: 'Acme', slug: 'acme', default: false }, FIELDS)).toEqual({
      name: { from: null, to: 'Acme' },
      slug: { from: null, to: 'acme' },
      default: { from: null, to: false },
    });
  });

  it('should record every field to null when the resource is deleted', () => {
    expect(diffSnapshots({ name: 'Acme', slug: 'acme' }, null, FIELDS)).toEqual({
      name: { from: 'Acme', to: null },
      slug: { from: 'acme', to: null },
    });
  });

  it('should record only the fields that changed on an update', () => {
    expect(diffSnapshots({ name: 'Acme', slug: 'acme' }, { name: 'Acme Inc', slug: 'acme' }, FIELDS)).toEqual({
      name: { from: 'Acme', to: 'Acme Inc' },
    });
  });

  it('should return null when nothing changed, so no event is written', () => {
    expect(diffSnapshots({ name: 'Acme', default: true }, { name: 'Acme', default: true }, FIELDS)).toBeNull();
  });

  it('should never record the value of a sensitive field', () => {
    expect(diffSnapshots({ secret: 'old-hash' }, { secret: 'new-hash' }, FIELDS)).toEqual({
      secret: { changed: true },
    });
  });

  it('should ignore fields that are not in the field spec', () => {
    expect(diffSnapshots({ name: 'A', internal: 1 }, { name: 'A', internal: 2 }, FIELDS)).toBeNull();
  });
});
