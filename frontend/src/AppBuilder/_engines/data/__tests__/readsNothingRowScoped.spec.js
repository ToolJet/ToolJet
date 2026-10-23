import { readsNothingRowScoped } from '../expressions';

const ROW_KEYS = ['listItem'];
const DESCENDANTS = new Set(['11111111-1111-4111-8111-111111111111']);
const sameOnEveryRow = (template) => readsNothingRowScoped(template, ROW_KEYS, DESCENDANTS);

describe('readsNothingRowScoped', () => {
  test('values outside the list are the same on every row', () => {
    expect(sameOnEveryRow('{{variables.theme}}')).toBe(true);
    expect(sameOnEveryRow('{{components["22222222-2222-4222-8222-222222222222"].value}}')).toBe(true);
    expect(sameOnEveryRow('Hello {{globals.currentUser.email}}')).toBe(true);
    expect(sameOnEveryRow('{{variables.count >= 2 ? "a" : "b"}}')).toBe(true);
    expect(sameOnEveryRow('{{[1, 2]}}')).toBe(true);
    expect(sameOnEveryRow('plain text')).toBe(true);
  });

  test('the row, a component inside the list, or anything that can differ between evaluations is per row', () => {
    expect(sameOnEveryRow('{{listItem.name}}')).toBe(false);
    expect(sameOnEveryRow('{{listItem?.name}}')).toBe(false);
    expect(sameOnEveryRow('{{components["11111111-1111-4111-8111-111111111111"].value}}')).toBe(false);
    expect(sameOnEveryRow('{{Math.random()}}')).toBe(false);
    expect(sameOnEveryRow('{{moment().format()}}')).toBe(false);
    expect(sameOnEveryRow('{{variables.n = 1}}')).toBe(false);
    expect(sameOnEveryRow('{{variables.n++}}')).toBe(false);
    expect(sameOnEveryRow('{{new Date().getTime()}}')).toBe(false);
    expect(sameOnEveryRow('{{this.x}}')).toBe(false);
    expect(sameOnEveryRow(undefined)).toBe(false);
    expect(sameOnEveryRow({ value: 1 })).toBe(false);
  });

  test('row names are matched as whole words, and escaped', () => {
    expect(readsNothingRowScoped('{{variables.listItemCount}}', ROW_KEYS, null)).toBe(true);
    expect(readsNothingRowScoped('{{a.b}}', ['a.b'], null)).toBe(false);
  });
});
