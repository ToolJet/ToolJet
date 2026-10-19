import React, { useCallback, useEffect, useState } from 'react';
import cx from 'classnames';
import moment from 'moment';
import { toast } from 'react-hot-toast';
import Layout from '@/_ui/Layout';
import { migrationsService } from '@/_services/migrations.service';
import {
  Button,
  InlineInfo,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Empty,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/Rocket';

const POLL_MS = 2000;

const STATUS_PILL = {
  running: { label: 'Running', className: 'tw-bg-background-accent-weak tw-text-text-accent' },
  succeeded: { label: 'Succeeded', className: 'tw-bg-background-success-weak tw-text-text-success' },
  failed: { label: 'Failed', className: 'tw-bg-background-error-weak tw-text-text-danger' },
};

const MIGRATION_STATUS_CLASS = {
  done: 'tw-text-text-success',
  running: 'tw-text-text-accent',
  pending: 'tw-text-text-placeholder',
  failed: 'tw-text-text-danger',
};

const formatDuration = (run) => {
  if (!run.finishedAt) return '—';
  return moment.duration(moment(run.finishedAt).diff(moment(run.startedAt))).humanize();
};

const StatusPill = ({ status }) => {
  const pill = STATUS_PILL[status] ?? { label: status, className: 'tw-bg-background-surface-layer-02' };
  return (
    <span className={cx('tw-rounded-full tw-px-2 tw-py-0.5 tw-font-title-default', pill.className)}>{pill.label}</span>
  );
};

const Card = ({ title, children }) => (
  <section className="tw-flex tw-flex-col tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-border-weak tw-bg-background-surface-layer-01 tw-p-4">
    {title && <h2 className="tw-m-0 tw-font-title-large tw-text-text-default">{title}</h2>}
    {children}
  </section>
);

const Field = ({ label, children }) => (
  <div className="tw-flex tw-flex-col tw-gap-0.5">
    <span className="tw-font-body-small tw-text-text-placeholder">{label}</span>
    <span className="tw-font-body-default tw-text-text-default">{children}</span>
  </div>
);

const SummaryCard = ({ run }) => (
  <Card>
    <div className="tw-flex tw-items-center tw-justify-between tw-gap-2">
      <h2 className="tw-m-0 tw-font-title-x-large tw-text-text-default">
        Upgrading {run.fromVersion} → {run.toVersion}
      </h2>
      <StatusPill status={run.status} />
    </div>
    <div className="tw-flex tw-gap-8">
      <Field label="Started">
        {moment(run.startedAt).format('lll')} ({moment(run.startedAt).fromNow()})
      </Field>
      <Field label="Triggered by">{run.triggeredBy}</Field>
    </div>
  </Card>
);

const ProgressCard = ({ run }) => {
  const percent = run.migrationsTotal ? Math.round((run.migrationsDone / run.migrationsTotal) * 100) : 0;
  return (
    <Card title="Progress">
      {run.currentMigration && (
        <div className="tw-flex tw-items-center tw-justify-between tw-gap-2">
          <code className="tw-font-code-regular tw-text-text-default">{run.currentMigration}</code>
          {run.progress && <span className="tw-font-body-default tw-text-text-placeholder">{run.progress}</span>}
        </div>
      )}
      <div className="tw-h-2 tw-w-full tw-overflow-hidden tw-rounded-full tw-bg-background-surface-layer-02">
        <div className="tw-h-full tw-bg-background-accent-strong" style={{ width: `${percent}%` }} />
      </div>
      <p className="tw-m-0 tw-font-body-default tw-text-text-placeholder">
        {run.migrationsDone} of {run.migrationsTotal} migrations
        {run.status === 'running' && ' · one transaction, nothing committed yet'}
      </p>
      <ul className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-1 tw-p-0">
        {run.migrations.map((migration) => (
          <li key={migration.name} className="tw-flex tw-items-center tw-justify-between tw-gap-2">
            <code className="tw-font-code-regular tw-text-text-default">{migration.name}</code>
            <span className={cx('tw-font-body-small', MIGRATION_STATUS_CLASS[migration.status])}>
              {migration.status}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
};

const LogCard = ({ logTail }) => (
  <Card title="Log">
    <pre className="tw-m-0 tw-max-h-80 tw-overflow-auto tw-rounded-md tw-border tw-border-solid tw-border-border-weak tw-bg-background-surface-layer-02 tw-p-3 tw-font-code-regular tw-text-text-default">
      {logTail.join('\n')}
    </pre>
    <span className="tw-font-body-small tw-text-text-placeholder">
      Last 200 lines · query parameters and secrets removed
    </span>
  </Card>
);

const HistoryCard = ({ runs }) => (
  <Card title="History">
    {runs.length === 0 ? (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>No migrations have run in async mode yet.</EmptyTitle>
        </EmptyHeader>
      </Empty>
    ) : (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Started</TableHead>
            <TableHead>Version</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Triggered by</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {runs.map((run) => (
            <TableRow key={run.id}>
              <TableCell>{moment(run.startedAt).format('lll')}</TableCell>
              <TableCell>
                {run.fromVersion} → {run.toVersion}
              </TableCell>
              <TableCell>
                <StatusPill status={run.status} />
              </TableCell>
              <TableCell>{formatDuration(run)}</TableCell>
              <TableCell>{run.triggeredBy}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )}
  </Card>
);

export const MigrationsPage = ({ switchDarkMode, darkMode }) => {
  const [runs, setRuns] = useState(null);
  const [retryRequested, setRetryRequested] = useState(false);
  const latest = runs?.[0];

  const load = useCallback(
    () =>
      migrationsService
        .getRuns()
        .then((data) => setRuns(data?.runs ?? []))
        .catch(() => setRuns((prev) => prev ?? [])),
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (latest?.status !== 'running') return;
    const timer = setInterval(load, POLL_MS);
    return () => clearInterval(timer);
  }, [latest?.status, load]);

  // "Retry requested" holds until the newest run changes.
  useEffect(() => {
    setRetryRequested(false);
  }, [latest?.id, latest?.status]);

  const retry = () => {
    setRetryRequested(true);
    migrationsService
      .retry()
      .then(() => {
        toast.success('Retry requested. The migration will start shortly.');
        load();
      })
      .catch((err) => {
        setRetryRequested(false);
        toast.error(err?.statusCode === 409 ? 'There is nothing to retry.' : err?.error || 'Could not retry.');
      });
  };

  return (
    <Layout switchDarkMode={switchDarkMode} darkMode={darkMode}>
      <div className="tw-h-full tw-w-full tw-overflow-y-auto">
        <div className="tw-mx-auto tw-flex tw-max-w-[960px] tw-flex-col tw-gap-4 tw-px-6 tw-py-10">
          <h1 className="tw-m-0 tw-font-title-heavy-x-large tw-text-text-default">Migrations</h1>
          {latest?.status === 'failed' && (
            <InlineInfo
              type="danger"
              variant="filled"
              title={`Upgrade to ${latest.toVersion} failed. Nothing was committed.`}
              description={latest.error && <code className="tw-font-code-regular">{latest.error}</code>}
              action={
                <Button onClick={retry} disabled={retryRequested}>
                  {retryRequested ? 'Retry requested' : 'Retry migration'}
                </Button>
              }
            />
          )}
          {latest && (
            <>
              <SummaryCard run={latest} />
              <ProgressCard run={latest} />
              <LogCard logTail={latest.logTail} />
            </>
          )}
          {runs && <HistoryCard runs={runs} />}
        </div>
      </div>
    </Layout>
  );
};

export default MigrationsPage;
