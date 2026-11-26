/** @group platform */
import { EntityManager } from 'typeorm';
import { Page } from '@entities/page.entity';
import { Component } from '@entities/component.entity';
import { PageService } from '@modules/apps/services/page.service';

const inputId = '11111111-1111-4111-8111-111111111111';
const outsideInputId = '22222222-2222-4222-8222-222222222222';
const queryId = '33333333-3333-4333-8333-333333333333';
const sourceId = 'source-page';
const copyId = 'copied-page';

async function duplicate(variables: Page['variables']) {
  const source = Object.assign(new Page(), { id: sourceId, variables });
  const copy = Object.assign(new Page(), { id: copyId, variables: structuredClone(variables) });
  const original = structuredClone(variables);
  const input = Object.assign(new Component(), {
    id: inputId,
    name: 'nameInput',
    type: 'TextInput',
    parent: null,
    pageId: sourceId,
    properties: {},
    styles: {},
  });
  const components: Component[] = [];
  const manager = {
    find: async (entity: unknown, options: { where: { id?: string } }) => {
      if (entity === Component) return [input];
      if (entity === Page)
        return [source, copy].filter((p) => p.id === options.where.id).map((p) => structuredClone(p));
      return [];
    },
    create: (_entity: unknown, values: Partial<Component>) => ({ ...values }),
    save: async (entityOrRows: unknown, rows?: unknown[]) => {
      const list = Array.isArray(entityOrRows) ? entityOrRows : rows;
      if (Array.isArray(list)) components.push(...list.filter((row) => row.pageId === copyId));
      return list;
    },
    update: async (_entity: unknown, criteria: { id: string }, changes: Partial<Page>) => {
      Object.assign(
        [source, copy].find((p) => p.id === criteria.id),
        changes
      );
    },
  } as unknown as EntityManager;
  const dependencies = [
    null,
    null,
    { findAllEventsWithSourceId: async () => [] },
    { warn: () => {} },
    null,
    null,
  ] as unknown as ConstructorParameters<typeof PageService>;
  await new PageService(...dependencies).clonePageEventsAndComponents(sourceId, copyId, manager);
  const copiedInput = components.find((c) => c.name === 'nameInput');
  expect(copiedInput.id).not.toBe(inputId);
  expect(source.variables).toEqual(original);
  return { variables: copy.variables, inputId: copiedInput.id };
}

const definitions = (value: string): NonNullable<Page['variables']> => ({
  greeting: { value, fxActive: false },
});

describe('PageService | duplicated page variables', () => {
  // Break this catches: a duplicated variable continues reading the source input rather than its own copy.
  it('should bind to the copied input and keep variable definition ids', async () => {
    const result = await duplicate(definitions(`{{'Hi ' + components.${inputId}.value}}`));
    expect(result.variables).toEqual(definitions(`{{'Hi ' + components.${result.inputId}.value}}`));
  });

  it('should remap bracket references without changing query ids or other-page components', async () => {
    const result = await duplicate(
      definitions(`{{components['${inputId}'].value + queries.${queryId}.data + components.${outsideInputId}.value}}`)
    );
    expect(result.variables).toEqual(
      definitions(
        `{{components["${result.inputId}"].value + queries.${queryId}.data + components.${outsideInputId}.value}}`
      )
    );
  });

  it.each([
    '0',
    'false',
    'null',
    '',
    '{"name":"Ada"}',
    '{{variables.shared + page.variables.local}}',
    `{{queries.${queryId}.data}}`,
  ])('should preserve values without a reference to a copied component: %s', async (value) => {
    expect((await duplicate(definitions(value))).variables).toEqual(definitions(value));
  });

  it.each([null, {}])('should preserve pages without declarations (%j)', async (variables) => {
    expect((await duplicate(variables)).variables).toEqual(variables);
  });
});
