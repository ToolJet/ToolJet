// Yields the event loop between batches so a large spec's synchronous per-batch work doesn't
// starve other jobs/requests sharing this process for the whole duration of a big spec.
export function sleep(ms = 0): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
