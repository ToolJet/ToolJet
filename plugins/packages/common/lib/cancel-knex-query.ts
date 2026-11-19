/*
 * Cancels a SQL query on the database server when `signal` fires (a workflow step's deadline or
 * the run's termination), instead of leaving it running after the caller has given up on it.
 * PostgreSQL and MySQL use knex's own cancel (pg_cancel_backend / KILL QUERY, sent on a separate
 * connection); MSSQL cancels its request on the tedious connection. Only this query's connection
 * is cancelled: pooled connections are shared with other queries.
 */

interface KnexLike {
  client?: {
    cancelQuery?: (connection: unknown) => Promise<unknown>;
    pool?: { used?: Array<{ resource?: { __knexUid?: string } }> };
  };
}

interface EmittingQuery<T> extends PromiseLike<T> {
  on?: (event: 'query', listener: (data: { __knexUid?: string }) => void) => unknown;
}

export async function cancelOnSignal(knex: KnexLike, connection: unknown): Promise<void> {
  try {
    if (typeof knex?.client?.cancelQuery === 'function') {
      await knex.client.cancelQuery(connection);
    } else if (typeof (connection as { cancel?: () => void })?.cancel === 'function') {
      (connection as { cancel: () => void }).cancel(); // tedious (MSSQL)
    }
  } catch {
    // Best effort: the statement timeout still bounds the query
  }
}

/** Runs a knex query (builder or raw), cancelling it server-side if `signal` fires first. */
export async function cancelKnexQueryOnAbort<T>(
  knex: KnexLike,
  query: EmittingQuery<T>,
  signal?: AbortSignal
): Promise<T> {
  if (!signal || typeof query.on !== 'function') return query;
  let connectionUid: string | undefined;
  const cancel = () => {
    const connection = knex?.client?.pool?.used?.find((used) => used?.resource?.__knexUid === connectionUid)?.resource;
    if (connection) void cancelOnSignal(knex, connection);
  };
  query.on('query', (data) => {
    connectionUid = data?.__knexUid;
    // Fired before the query reached its connection: cancel as soon as it does
    if (signal.aborted) cancel();
  });
  signal.addEventListener('abort', cancel, { once: true });
  try {
    return await query;
  } finally {
    signal.removeEventListener('abort', cancel);
  }
}
