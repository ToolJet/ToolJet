import { useEffect, useState } from 'react';
import { tooljetDatabaseService } from '@/_services/tooljetDatabase.service';
import { buildCastabilityCountQuery, castFor } from '../../columnTypeChange';

export type Probe = { kind: 'regex' | 'range'; [field: string]: unknown };

export type CastReport =
  | { status: 'loading' }
  | { status: 'uncheckable' }
  | { status: 'error'; message: string }
  | { status: 'done'; count: number; probe: Probe; columnName: string };

type Options = {
  savedType: string;
  targetType: string | null;
  columnName: string;
  tableId: string;
  organizationId: string;
  environmentId?: string;
};

type SqlResult = {
  error?: { message?: string };
  data?: { result?: { status?: string; error_message?: string; data?: { message?: string } | { count?: unknown }[] } };
};

/**
 * Advisory only: Postgres' own ALTER decides whether a cast succeeds. This counts the values in the open environment
 * that a risky cast would reject, because its error names one arbitrary bad value and no count.
 */
export function useCastReport({
  savedType,
  targetType,
  columnName,
  tableId,
  organizationId,
  environmentId,
}: Options): CastReport | null {
  const [report, setReport] = useState<CastReport | null>(null);

  useEffect(() => {
    const cast = targetType && savedType !== targetType ? castFor(savedType, targetType) : null;
    if (!cast || cast.tier !== 'may_fail') return setReport(null);
    if (!environmentId) return;

    const query = buildCastabilityCountQuery({ columnName, probe: cast.probe });
    if (!query) return setReport({ status: 'uncheckable' });

    let cancelled = false;
    setReport({ status: 'loading' });
    (
      tooljetDatabaseService.sqlExecution(organizationId, tableId, {
        sql: query,
        environment_id: environmentId,
      }) as Promise<SqlResult>
    ).then(({ error, data }) => {
      if (cancelled) return;
      // A SQL-level failure comes back as a 2xx body shaped { result: { status: 'failed', ... } }, so the adapter's own
      // `error` stays unset: checking only `error` would read a failed probe as "every value converts cleanly", the one
      // wrong answer this report must never give.
      const result = data?.result;
      if (error || result?.status === 'failed') {
        const detail = result?.data as { message?: string } | undefined;
        const message =
          error?.message ??
          ([result?.error_message, detail?.message].filter(Boolean).join(': ') || 'Could not check existing values');
        return setReport({ status: 'error', message });
      }
      // COUNT(*) comes back as a numeric-looking string. A missing or reshaped row must not read as "0 will fail":
      // Number() plus isFinite catches that.
      const rows = Array.isArray(result?.data) ? (result?.data as { count?: unknown }[]) : [];
      const count = Number(rows[0]?.count);
      if (!Number.isFinite(count)) return setReport({ status: 'error', message: 'Could not check existing values' });
      // The probe and column travel with the report so "Show rows" uses exactly what this check ran against.
      setReport({ status: 'done', count, probe: cast.probe as Probe, columnName });
    });
    return () => {
      cancelled = true;
    };
  }, [savedType, targetType, columnName, tableId, organizationId, environmentId]);

  return report;
}
