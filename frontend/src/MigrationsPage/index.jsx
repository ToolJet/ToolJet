import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import cx from 'classnames';
import moment from 'moment';
import { toast } from 'react-hot-toast';
import {
  IconAlertTriangle,
  IconCircleCheck,
  IconCircleDashed,
  IconCircleX,
  IconChevronRight,
  IconCopy,
  IconDownload,
  IconLoader2,
} from '@tabler/icons-react';
import Layout from '@/_ui/Layout';
import { copyToClipboard } from '@/_helpers/appUtils';
import { migrationsService } from '@/_services/migrations.service';
import {
  Button,
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  InlineInfo,
  Skeleton,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/Rocket';

const ACTIVE_POLL_MS = 2000;
const IDLE_POLL_MS = 15000;

const STATUS = {
  running: {
    label: 'Running',
    Icon: IconLoader2,
    tone: 'tw-text-text-accent',
    pill: 'tw-bg-background-accent-weak tw-text-text-accent',
    spin: true,
    headline: (run) => `Upgrading to ${run.toVersion}`,
  },
  succeeded: {
    label: 'Succeeded',
    Icon: IconCircleCheck,
    tone: 'tw-text-text-success',
    pill: 'tw-bg-background-success-weak tw-text-text-success',
    headline: (run) => `Upgraded to ${run.toVersion}`,
  },
  failed: {
    label: 'Failed',
    Icon: IconAlertTriangle,
    tone: 'tw-text-text-danger',
    pill: 'tw-bg-background-error-weak tw-text-text-danger',
    headline: (run) => `Upgrade to ${run.toVersion} failed`,
  },
};

const STEP = {
  done: { label: 'Done', Icon: IconCircleCheck, tone: 'tw-text-text-success' },
  running: { label: 'Running', Icon: IconLoader2, tone: 'tw-text-text-accent', spin: true },
  pending: { label: 'Waiting', Icon: IconCircleDashed, tone: 'tw-text-text-placeholder' },
  failed: { label: 'Failed', Icon: IconCircleX, tone: 'tw-text-text-danger' },
};

export const formatMs = (ms) => {
  if (ms < 1000) return '<1s';
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.round((ms % 60_000) / 1000);
  return minutes < 60 ? `${minutes}m ${seconds}s` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};

const elapsed = (run) => moment(run.finishedAt ?? undefined).diff(moment(run.startedAt));
const triggeredBy = (run) => (run.triggeredBy === 'boot' ? 'server start' : run.triggeredBy);
const plural = (count, noun) => `${count} ${noun}${count === 1 ? '' : 's'}`;

const StatusPill = ({ status }) => {
  const meta = STATUS[status] ?? STATUS.running;
  return (
    <span className={cx('tw-shrink-0 tw-rounded-full tw-px-2 tw-py-0.5 tw-font-title-default', meta.pill)}>
      {meta.label}
    </span>
  );
};

const Card = ({ className, children }) => (
  <section
    className={cx(
      'tw-flex tw-flex-col tw-gap-4 tw-rounded-lg tw-border tw-border-solid tw-border-border-weak tw-bg-background-surface-layer-01 tw-p-5',
      className
    )}
  >
    {children}
  </section>
);

const Bar = ({ percent, label, className }) => (
  <div
    role="progressbar"
    aria-label={label}
    aria-valuenow={percent}
    aria-valuemin={0}
    aria-valuemax={100}
    className={cx('tw-overflow-hidden tw-rounded-full tw-bg-background-surface-layer-02', className)}
  >
    <div
      className="tw-h-full tw-bg-background-accent-strong tw-transition-[width] tw-duration-300"
      style={{ width: `${percent}%` }}
    />
  </div>
);

/** One line under the headline: how many, how long, when, who. */
const facts = (run) => {
  const parts = [];
  if (run.migrationsTotal) parts.push(plural(run.migrationsTotal, 'migration'));
  if (run.fromVersion && run.fromVersion !== run.toVersion) parts.push(`from ${run.fromVersion}`);
  if (run.status === 'running') parts.push(`running for ${formatMs(elapsed(run))}`);
  else parts.push(`took ${formatMs(elapsed(run))}`);
  parts.push(`started ${moment(run.startedAt).fromNow()}`);
  parts.push(`by ${triggeredBy(run)}`);
  return parts.join(' · ');
};

const StatusCard = ({ run, onRun, runPending }) => {
  const meta = STATUS[run.status] ?? STATUS.running;
  const percent = run.migrationsTotal ? Math.round((run.migrationsDone / run.migrationsTotal) * 100) : 0;
  const current = run.migrations.find((step) => step.status === 'running');

  return (
    <Card>
      <div className="tw-flex tw-items-start tw-gap-3">
        <meta.Icon
          size={28}
          stroke={1.75}
          aria-hidden
          className={cx('tw-mt-0.5 tw-shrink-0', meta.tone, meta.spin && 'tw-animate-spin')}
        />
        <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-gap-1">
          <div className="tw-flex tw-items-center tw-gap-2">
            <h2 className="tw-m-0 tw-truncate tw-font-title-x-large tw-text-text-default">{meta.headline(run)}</h2>
            <StatusPill status={run.status} />
          </div>
          <p
            className="tw-m-0 tw-font-body-default tw-text-text-placeholder"
            title={moment(run.startedAt).format('lll')}
          >
            {facts(run)}
          </p>
        </div>
        {run.status === 'failed' && (
          <Button className="tw-shrink-0" onClick={onRun} disabled={runPending}>
            {runPending ? 'Starting' : 'Retry migration'}
          </Button>
        )}
      </div>

      {run.status === 'running' && run.migrationsTotal > 0 && (
        <div className="tw-flex tw-flex-col tw-gap-2">
          <Bar percent={percent} label="Overall progress" className="tw-h-2" />
          <div className="tw-flex tw-justify-between tw-gap-2 tw-font-body-small tw-text-text-placeholder">
            <span className="tw-truncate">{current ? `Now running ${current.name}` : 'Starting'}</span>
            <span className="tw-shrink-0">
              {run.migrationsDone} of {run.migrationsTotal} done
            </span>
          </div>
        </div>
      )}

      {run.status === 'running' && (
        <p className="tw-m-0 tw-font-body-small tw-text-text-placeholder">
          Schema changes were applied when the server started. The data migrations run in one transaction, so none of
          them is saved until the last one finishes. Changes made in ToolJet are refused until then.
        </p>
      )}

      {run.status === 'failed' && (
        <InlineInfo
          type="danger"
          title="The data migrations were rolled back. Changes made in ToolJet are refused until a retry succeeds."
          description={
            <>
              {run.error && (
                <code className="tw-mb-2 tw-block tw-max-h-32 tw-overflow-auto tw-whitespace-pre-wrap tw-break-words tw-font-code-regular">
                  {run.error}
                </code>
              )}
              <span className="tw-block">Retrying runs the pending data migrations again, in one transaction.</span>
            </>
          }
        />
      )}
    </Card>
  );
};

const stepDetail = (step, run) => {
  if (step.status === 'running' && step.percent !== undefined) return `${step.percent}%`;
  if (step.status === 'running' && run.progress) return run.progress;
  if (step.durationMs !== undefined) return formatMs(step.durationMs);
  return STEP[step.status]?.label ?? '';
};

/** One migration's own log lines, refetched as the run's log grows while it runs. */
const StepLog = ({ runId, step, logSize }) => {
  const [log, setLog] = useState(null);
  const refresh = step.status === 'running' ? logSize : 0;

  useEffect(() => {
    let cancelled = false;
    migrationsService
      .getLog(runId, step.name)
      .then((text) => !cancelled && setLog(text))
      .catch(() => !cancelled && setLog(''));
    return () => {
      cancelled = true;
    };
  }, [runId, step.name, refresh]);

  if (log === null) return <Skeleton className="tw-h-16 tw-w-full" />;
  return (
    <pre
      tabIndex={0}
      aria-label={`${step.name} log`}
      className="tw-m-0 tw-max-h-64 tw-overflow-auto tw-rounded-md tw-bg-background-surface-layer-02 tw-p-3 tw-font-code-regular tw-text-text-default"
    >
      {log || 'This migration logged nothing.'}
    </pre>
  );
};

const MigrationRow = ({ step, run }) => {
  const [open, setOpen] = useState(false);
  const meta = STEP[step.status] ?? STEP.pending;
  const live = step.status === 'running' && step.percent !== undefined;
  const hasLog = step.status !== 'pending';
  return (
    <li className="tw-flex tw-flex-col tw-gap-1">
      <button
        type="button"
        disabled={!hasLog}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="tw-flex tw-w-full tw-items-center tw-gap-3 tw-rounded-md tw-border-0 tw-bg-transparent tw-px-2 tw-py-1.5 tw-text-left enabled:tw-cursor-pointer enabled:hover:tw-bg-interactive-hover"
      >
        <IconChevronRight
          size={14}
          aria-hidden
          className={cx(
            'tw-shrink-0 tw-text-icon-default tw-transition-transform',
            open && 'tw-rotate-90',
            !hasLog && 'tw-invisible'
          )}
        />
        <meta.Icon
          size={16}
          stroke={2}
          aria-label={meta.label}
          className={cx('tw-shrink-0', meta.tone, meta.spin && 'tw-animate-spin')}
        />
        <span className="tw-min-w-0 tw-flex-1 tw-truncate tw-font-code-regular tw-text-text-default" title={step.name}>
          {step.name}
        </span>
        {live && (
          <Bar percent={step.percent} label={`${step.name} progress`} className="tw-h-1.5 tw-w-24 tw-shrink-0" />
        )}
        <span
          className={cx(
            'tw-w-16 tw-shrink-0 tw-text-right tw-font-body-small',
            live ? meta.tone : 'tw-text-text-placeholder'
          )}
        >
          {stepDetail(step, run)}
        </span>
      </button>
      {open && (
        <div className="tw-pb-2 tw-pl-9">
          <StepLog runId={run.id} step={step} logSize={run.logTail.length} />
        </div>
      )}
    </li>
  );
};

const downloadLog = (run) =>
  migrationsService
    .getLog(run.id)
    .then((text) => {
      const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
      const link = Object.assign(document.createElement('a'), {
        href: url,
        download: `tooljet-migration-${run.toVersion}-${run.id.slice(0, 8)}.log`,
      });
      link.click();
      URL.revokeObjectURL(url);
    })
    .catch(() => toast.error('Could not download the log.'));

const EMPTY_MIGRATIONS_MESSAGE = {
  running: 'Checking which migrations need to run.',
  succeeded: 'Nothing to migrate. The database was already up to date.',
  failed: 'The run stopped before it could list its migrations. The log shows why.',
};

const MigrationsCard = ({ run }) => {
  if (run.migrationsTotal === 0) {
    return (
      <Card>
        <h3 className="tw-m-0 tw-font-title-large tw-text-text-default">Migrations</h3>
        <p className="tw-m-0 tw-font-body-default tw-text-text-placeholder">{EMPTY_MIGRATIONS_MESSAGE[run.status]}</p>
      </Card>
    );
  }
  return (
    <Card className="tw-gap-2">
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-2">
        <h3 className="tw-m-0 tw-font-title-large tw-text-text-default">Migrations</h3>
        <span className="tw-font-body-small tw-text-text-placeholder">
          {run.migrationsDone} of {run.migrationsTotal} done
        </span>
      </div>
      <ul className="tw-m-0 tw-flex tw-max-h-[32rem] tw-list-none tw-flex-col tw-overflow-y-auto tw-p-0">
        {run.migrations.map((step) => (
          <MigrationRow key={step.name} step={step} run={run} />
        ))}
      </ul>
    </Card>
  );
};

const LogCard = ({ run, open }) => {
  const { logTail } = run;
  const ref = useRef(null);
  const text = logTail.join('\n');

  // Follow the tail while it grows, unless the reader scrolled up.
  useLayoutEffect(() => {
    const el = ref.current;
    if (el && el.scrollHeight - el.scrollTop - el.clientHeight < 80) el.scrollTop = el.scrollHeight;
  }, [text]);

  if (logTail.length === 0) return null;
  return (
    // Re-keyed so a run that starts or fails opens the log on its own.
    <Collapsible defaultOpen={open} key={String(open)}>
      <CollapsibleTrigger>
        <span className="tw-flex tw-flex-1 tw-items-center tw-gap-2">
          <span className="tw-font-title-large tw-text-text-default">Log</span>
          <span className="tw-font-body-small tw-text-text-placeholder">{plural(logTail.length, 'line')}</span>
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="tw-flex tw-flex-col tw-gap-2">
          <pre
            ref={ref}
            tabIndex={0}
            aria-label="Migration log"
            className="tw-m-0 tw-max-h-80 tw-overflow-auto tw-rounded-md tw-bg-background-surface-layer-02 tw-p-3 tw-font-code-regular tw-text-text-default"
          >
            {text}
          </pre>
          <div className="tw-flex tw-items-center tw-justify-between tw-gap-2">
            <span className="tw-font-body-small tw-text-text-placeholder">
              Last 200 lines. Click a migration to see its own lines. Sensitive information is redacted.
            </span>
            <div className="tw-flex tw-gap-1">
              <Button variant="ghost" size="small" onClick={() => copyToClipboard(text)}>
                <IconCopy size={14} aria-hidden /> Copy
              </Button>
              <Button variant="ghost" size="small" onClick={() => downloadLog(run)}>
                <IconDownload size={14} aria-hidden /> Download full log
              </Button>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

const HistoryCard = ({ runs }) => (
  <Card className="tw-gap-2">
    <h3 className="tw-m-0 tw-font-title-large tw-text-text-default">Earlier runs</h3>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Status</TableHead>
          <TableHead>Version</TableHead>
          <TableHead>Started</TableHead>
          <TableHead>Took</TableHead>
          <TableHead>By</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {runs.map((run) => (
          <TableRow key={run.id}>
            <TableCell>
              <StatusPill status={run.status} />
            </TableCell>
            <TableCell>
              {run.fromVersion && run.fromVersion !== run.toVersion
                ? `${run.fromVersion} → ${run.toVersion}`
                : run.toVersion}
            </TableCell>
            <TableCell title={moment(run.startedAt).format('lll')}>{moment(run.startedAt).fromNow()}</TableCell>
            <TableCell>{run.status === 'running' ? '-' : formatMs(elapsed(run))}</TableCell>
            <TableCell className="tw-max-w-[220px] tw-truncate">{triggeredBy(run)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </Card>
);

const LoadingState = () => (
  <div aria-busy="true" aria-label="Loading migration runs" className="tw-flex tw-flex-col tw-gap-4">
    <Skeleton className="tw-h-24 tw-w-full" />
    <Skeleton className="tw-h-40 tw-w-full" />
    <Skeleton className="tw-h-14 tw-w-full" />
  </div>
);

const EmptyState = () => (
  <Empty>
    <EmptyHeader>
      <EmptyTitle>No migration runs yet</EmptyTitle>
      <EmptyDescription>
        Runs appear here when ToolJet starts with MIGRATION_MODE=async and finds migrations to run.
      </EmptyDescription>
    </EmptyHeader>
  </Empty>
);

const MigrationsContent = () => {
  const [runs, setRuns] = useState(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [runPending, setRunPending] = useState(false);
  const requestSeq = useRef(0);
  const latest = runs?.[0];

  const load = useCallback(() => {
    // Polls can overlap; only the newest answer is applied.
    const seq = ++requestSeq.current;
    return migrationsService
      .getRuns()
      .then((data) => {
        if (seq !== requestSeq.current) return;
        setRuns(data?.runs ?? []);
        setLoadFailed(false);
      })
      .catch(() => seq === requestSeq.current && setLoadFailed(true));
  }, []);

  const active = latest?.status === 'running' || runPending;
  useEffect(() => {
    load();
    const timer = setInterval(load, active ? ACTIVE_POLL_MS : IDLE_POLL_MS);
    return () => clearInterval(timer);
  }, [active, load]);

  // Acknowledged once the latest run changes: a new row.
  useEffect(() => {
    setRunPending(false);
  }, [latest?.id, latest?.status]);

  const startRun = () => {
    setRunPending(true);
    migrationsService
      .run()
      .then(load)
      .catch((err) => {
        setRunPending(false);
        toast.error(
          err?.statusCode === 409 ? err.error || 'There is nothing to run.' : 'Could not start the migrations.'
        );
        load();
      });
  };

  if (runs === null) {
    return loadFailed ? (
      <InlineInfo
        type="danger"
        title="Could not load migration runs."
        action={
          <Button variant="outline" onClick={load}>
            Try again
          </Button>
        }
      />
    ) : (
      <LoadingState />
    );
  }
  if (!latest) return <EmptyState />;

  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      {loadFailed && <InlineInfo type="warning" title="Lost connection to the server. Showing the last known state." />}
      <StatusCard run={latest} onRun={startRun} runPending={runPending} />
      <MigrationsCard run={latest} />
      <LogCard run={latest} open={latest.status === 'running' || latest.status === 'failed'} />
      {runs.length > 1 && <HistoryCard runs={runs.slice(1)} />}
    </div>
  );
};

/** Page content. EE renders it inside the instance settings shell; CE wraps it in MigrationsPage. */
export const MigrationsPanel = () => (
  <div className="tw-mx-auto tw-max-w-[960px] tw-px-6 tw-pb-8">
    <MigrationsContent />
  </div>
);

/** CE has no instance settings shell, so the panel gets its own page. */
export const MigrationsPage = ({ switchDarkMode, darkMode }) => (
  <Layout switchDarkMode={switchDarkMode} darkMode={darkMode}>
    <div className="tw-h-full tw-w-full tw-overflow-y-auto tw-pt-8">
      <h1 className="tw-mx-auto tw-mb-4 tw-max-w-[960px] tw-px-6 tw-font-title-heavy-x-large tw-text-text-default">
        Migrations
      </h1>
      <MigrationsPanel />
    </div>
  </Layout>
);

export default MigrationsPage;
