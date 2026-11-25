/**
 * @tjBlock  licensing
 * @tjUsage  localA('x')
 */
const localA = (x) => x;

function localB() {}

export { localA, localB as renamedB };
