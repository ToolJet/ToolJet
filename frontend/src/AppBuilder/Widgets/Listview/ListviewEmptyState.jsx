import React from 'react';
import { IconLayoutRows } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

// Figma "No data found": a tinted icon square, a title and a subtitle, centred between header and footer.
export const ListviewEmptyState = () => {
  const { t } = useTranslation();
  return (
    <div
      data-cy="listview-empty-state"
      className="tw-gap-1 tw-text-center"
      style={{
        flex: '1 1 0%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        className="tw-flex tw-items-center tw-justify-center tw-w-10 tw-h-10 tw-rounded-lg tw-mb-1"
        style={{ background: 'color-mix(in srgb, var(--cc-primary-brand) 8%, transparent)' }}
      >
        <IconLayoutRows size={20} stroke={1.5} color="var(--cc-primary-brand)" />
      </div>
      <div className="tw-font-title-default tw-text-text-default">
        {t('widget.listview.noDataTitle', 'No data found')}
      </div>
      <div className="tw-font-body-default tw-text-text-placeholder">
        {t('widget.listview.noDataSubtitle', 'Connect your database or use sample data to see results')}
      </div>
    </div>
  );
};
