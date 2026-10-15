import { runSliced } from './slices';
import { isFeatureEnabled } from '../features';

// Values known to hold no cycle (parsed from JSON, or already checked): not walked again.
const acyclic = new WeakSet();

/** Records that `value` holds no cycle (a value parsed from JSON can't). */
export const markAcyclic = (value) => {
  if (value !== null && typeof value === 'object') acyclic.add(value);
  return value;
};

/**
 * A walk looking for an object that contains itself, at any depth, through own enumerable properties (what a `for…in`
 * with `hasOwnProperty` visits). Each object is walked once: a subtree shared by several parents isn't a cycle and
 * isn't walked again. `step(inTime, maxObjects)` walks while `inTime()`; it returns true once finished, with the answer
 * in `result.cyclic`.
 */
const createWalk = (value) => {
  const result = { cyclic: false };
  const path = new Set();
  const done = new WeakSet();
  const stack = [];
  let visited = 0;
  let steps = 0;
  const enter = (object) => {
    path.add(object);
    stack.push({ object, keys: Array.isArray(object) ? null : Object.keys(object), next: 0 });
    visited += 1;
  };
  if (value !== null && typeof value === 'object' && !acyclic.has(value)) enter(value);

  const step = (inTime, maxObjects = Infinity) => {
    while (stack.length) {
      const frame = stack[stack.length - 1];
      const { object, keys } = frame;
      const size = keys ? keys.length : object.length;
      if (frame.next < size) {
        const child = keys ? object[keys[frame.next++]] : object[frame.next++];
        if (child !== null && typeof child === 'object' && !done.has(child) && !acyclic.has(child)) {
          if (path.has(child)) {
            result.cyclic = true;
            return true;
          }
          if (visited >= maxObjects) return true;
          enter(child);
        }
        if ((++steps & 1023) === 0 && !inTime()) return false;
        continue;
      }
      path.delete(object);
      done.add(object);
      stack.pop();
    }
    return true;
  };
  return { step, result };
};

const always = () => true;

/**
 * Whether `value` contains itself, at any depth. With `maxObjects`, only that many objects are looked at and a cycle
 * beyond them isn't found (the code editor's check as you type: a dataset holds millions of objects).
 */
export const hasCycle = (value, maxObjects = Infinity) => {
  const { step, result } = createWalk(value);
  step(always, maxObjects);
  return result.cyclic;
};

/**
 * `hasCycle(value)` without blocking: the answer when the walk fits in one slice (a script's usual result), else a
 * promise of it. A value found to hold no cycle is remembered (`markAcyclic`).
 */
export const hasCycleInSlices = (value) => {
  if (!isFeatureEnabled('sliced-checks')) return hasCycle(value);
  const { step, result } = createWalk(value);
  const answer = () => {
    if (!result.cyclic) markAcyclic(value);
    return result.cyclic;
  };
  const pending = runSliced((inTime) => step(inTime));
  return pending ? pending.then(answer) : answer();
};
