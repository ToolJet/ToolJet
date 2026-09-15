// `await sleep(0)` yields the event loop between synchronous batches.
export function sleep(ms = 0): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
