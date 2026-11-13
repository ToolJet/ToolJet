/**
 * A component gets its co_relation_id the moment it is added to the canvas.
 *
 * The id is the component's identity across versions: version copy carries it over, so a compare can match a renamed
 * component to its earlier self. Components created without one stayed anonymous until a git push.
 */
import { ComponentsService } from '../../../../src/modules/apps/services/component.service';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const canvasDiff = (...names: string[]) =>
  Object.fromEntries(
    names.map((name, i) => [
      `0000000${i}-0000-4000-8000-000000000000`,
      { name, type: 'Button', properties: {}, styles: {}, layouts: {} },
    ])
  );

describe('ComponentsService.transformComponentData', () => {
  const transform = (data: object) => ComponentsService.prototype.transformComponentData.call(null, data);

  it('gives every component added to the canvas a co_relation_id', () => {
    const components = transform(canvasDiff('button1', 'button2'));

    expect(components).toHaveLength(2);
    components.forEach((component) => expect(component.co_relation_id).toMatch(UUID));
  });

  it('gives each component its own co_relation_id, distinct from its row id', () => {
    const [first, second] = transform(canvasDiff('button1', 'button2'));

    expect(first.co_relation_id).not.toBe(second.co_relation_id);
    expect(first.co_relation_id).not.toBe(first.id);
  });

  it('ignores a co_relation_id sent by the client, so a pasted component never shares its source identity', () => {
    const data = canvasDiff('button1');
    Object.values(data)[0]['co_relation_id'] = '11111111-1111-4111-8111-111111111111';

    const [component] = transform(data);

    expect(component.co_relation_id).not.toBe('11111111-1111-4111-8111-111111111111');
    expect(component.co_relation_id).toMatch(UUID);
  });
});
