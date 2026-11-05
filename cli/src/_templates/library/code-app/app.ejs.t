---
to: <%= name %>/src/App/index.tsx
---
import React, { useMemo, useRef, useState } from 'react';
import { MemoryRouter, NavLink, Route, Routes, useNavigate, useParams } from 'react-router';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '../components/ui/sheet';
import { usePortalContainer } from '../lib/portal';
import { cn } from '../lib/utils';
import '../styles/globals.css';

/*
  An app in Code mode: the whole UI is this one component, drawn on a single ToolJet page. ToolJet owns login, permissions,
  environments, data sources and queries; this code owns the screens and their navigation.

  Data comes in through props the builder binds to queries ({{queries.items.data}}); writes go out through an event
  the builder wires to a query, which reads the exposed `pending` state ({{components.app.pending.id}}).
  Call every ToolJet hook here, at the top of the exported component, so the CLI's manifest generator sees them.
*/

interface Item {
  id: number;
  name: string;
  status: string;
  [key: string]: unknown;
}

const ItemsList: React.FC<{ items: Item[] }> = ({ items }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const rows = items.filter((i) => !query || String(i.name).toLowerCase().includes(query.toLowerCase()));
  return (
    <section className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Items</h1>
        <Input className="w-64" placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((item) => (
                <TableRow key={item.id} className="cursor-pointer" onClick={() => navigate(`/items/${item.id}`)}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <Badge variant={item.status === 'done' ? 'success' : 'secondary'}>{item.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="py-10 text-center text-muted-foreground">
                    No items yet. Bind the Items prop to a query that returns rows with id, name and status.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
};

const ItemDetail: React.FC<{ items: Item[]; onUpdate: (id: number, status: string) => void }> = ({ items, onUpdate }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const anchor = useRef<HTMLElement>(null);
  const portal = usePortalContainer(anchor);
  const item = items.find((i) => String(i.id) === String(id));
  return (
    <section ref={anchor} className="p-6">
      <Button variant="ghost" onClick={() => navigate('/')}>
        Back
      </Button>
      <Sheet open={!!item} onOpenChange={(open) => !open && navigate('/')}>
        {item && (
          <SheetContent container={portal}>
            <SheetHeader>
              <SheetTitle>{item.name}</SheetTitle>
              <SheetDescription>Item #{item.id}</SheetDescription>
            </SheetHeader>
            <dl className="grid grid-cols-[100px_1fr] gap-2 text-sm">
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <Badge variant={item.status === 'done' ? 'success' : 'secondary'}>{item.status}</Badge>
              </dd>
            </dl>
            <SheetFooter>
              <Button disabled={item.status === 'done'} onClick={() => onUpdate(item.id, 'done')}>
                Mark done
              </Button>
            </SheetFooter>
          </SheetContent>
        )}
      </Sheet>
    </section>
  );
};

export const App: React.FC = () => {
  const [items] = ToolJet.useStateArray({ name: 'items', label: 'Items', description: 'Bind {{queries.items.data}}', initialValue: [] });
  const [currentUser] = ToolJet.useStateObject({ name: 'currentUser', label: 'Current user', description: 'Bind {{globals.currentUser}}', initialValue: {} });
  const [pending, setPending] = ToolJet.useStateObject({
    name: 'pending',
    label: 'Pending update',
    description: '{ id, status } the app asked to save; read it from the update query',
    initialValue: null,
    inspector: 'hidden',
  });
  const onUpdate = ToolJet.useEventCallback({ name: 'onUpdate', displayName: 'On update' });
  const onRefresh = ToolJet.useEventCallback({ name: 'onRefresh', displayName: 'On refresh' });
  ToolJet.useComponentSettings({ defaultWidth: 43, defaultHeight: 80, usage: 'An app in Code mode: list and detail of items.' });

  const rows = useMemo(() => (Array.isArray(items) ? (items as Item[]) : []), [items]);
  const update = (id: number, status: string) => {
    setPending({ id, status });
    onUpdate();
  };
  const user = currentUser as Record<string, unknown>;
  void pending;

  return (
    <MemoryRouter>
      <div className="app-root grid h-full grid-cols-[200px_1fr] bg-muted/40">
        <nav className="flex flex-col gap-1 border-r bg-background p-3">
          <div className="mb-3 px-3 py-2 font-semibold"><%= display_name %></div>
          <NavLink to="/" end className={({ isActive }) => cn('rounded-md px-3 py-2 text-sm font-medium', isActive ? 'bg-accent' : 'text-muted-foreground hover:bg-accent')}>
            Items
          </NavLink>
          <div className="mt-auto flex flex-col gap-2 border-t pt-3">
            <Button variant="outline" size="sm" onClick={onRefresh}>
              Refresh
            </Button>
            <span className="truncate px-1 text-xs text-muted-foreground">{String(user?.email ?? 'guest')}</span>
          </div>
        </nav>
        <main className="min-h-0 overflow-auto">
          <Routes>
            <Route path="/" element={<ItemsList items={rows} />} />
            <Route path="/items/:id" element={<ItemDetail items={rows} onUpdate={update} />} />
          </Routes>
        </main>
      </div>
    </MemoryRouter>
  );
};
