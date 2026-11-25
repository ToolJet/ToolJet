/**
 * @tjBlock  modules
 * @tjUsage  await loadThing(1)
 */
export async function loadThing(id) {
  return id;
}

export let counter = 0;

export class Page {}

const obj = { first: 1, second: 2 };
export const { first, second: renamed } = obj;

export function* steps() {}
