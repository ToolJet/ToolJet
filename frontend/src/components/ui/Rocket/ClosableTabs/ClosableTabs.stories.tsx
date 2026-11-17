import React, { useState } from 'react';
import { Table } from 'lucide-react';
import { ClosableTabs, type ClosableTabItem } from './ClosableTabs';

const NAMES = ['releases', 'authors', 'customers', 'orders'];
const MANY = [...NAMES, 'customer_orders_archive_2024_final', 'invoices', 'products', 'shipments', 'suppliers'];

const toTabs = (names: string[]): ClosableTabItem[] =>
  names.map((name) => ({ id: name, label: name, icon: <Table /> }));

function Interactive({ names, width, indicator }: { names: string[]; width: number; indicator?: 'bottom' | 'top' }) {
  const [tabs, setTabs] = useState(() => toTabs(names));
  const [activeId, setActiveId] = useState<string | null>('authors');
  const close = (id: string) => {
    const next = tabs.filter((tab) => tab.id !== id);
    setTabs(next);
    if (id === activeId) setActiveId(next[0]?.id ?? null);
  };
  return (
    <div
      className="tw-flex tw-h-12 tw-items-center tw-border-0 tw-border-b tw-border-solid tw-border-border-weak tw-bg-page-weak tw-px-2"
      style={{ width }}
    >
      <ClosableTabs
        aria-label="Open tables"
        tabs={tabs}
        activeId={activeId}
        indicator={indicator}
        onSelect={setActiveId}
        onClose={close}
      />
    </div>
  );
}

export default {
  title: 'Rocket/ClosableTabs',
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  component: ClosableTabs,
};

export const Default = { render: () => <Interactive names={NAMES} width={960} /> };

// Tabs shrink to 128px, then the list scrolls; a chevron shows on each side that has hidden tabs.
export const Overflow = { render: () => <Interactive names={MANY} width={720} /> };

export const TopIndicator = { render: () => <Interactive names={NAMES} width={960} indicator="top" /> };
