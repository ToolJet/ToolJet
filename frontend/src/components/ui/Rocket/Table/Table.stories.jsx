import React from 'react';
import { Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableCaption } from './Table';

export default {
  title: 'Rocket/Table',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};

const sampleRows = [
  { name: 'My first app', editedBy: 'Alice', editedAt: 'Edited 2m ago', type: 'App' },
  { name: 'Customer dashboard', editedBy: 'Bob', editedAt: 'Edited 1h ago', type: 'App' },
  { name: 'Sales pipeline', editedBy: 'Carol', editedAt: 'Edited yesterday', type: 'Workflow' },
  { name: 'HR onboarding', editedBy: 'Dan', editedAt: 'Edited 3 days ago', type: 'Workflow' },
];

// ── Default ─────────────────────────────────────────────────────────────────

export const Default = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Edited by</TableHead>
          <TableHead>Edited at</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sampleRows.map((row) => (
          <TableRow key={row.name}>
            <TableCell>{row.name}</TableCell>
            <TableCell>{row.type}</TableCell>
            <TableCell>{row.editedBy}</TableCell>
            <TableCell>{row.editedAt}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

// ── Compact density ─────────────────────────────────────────────────────────

export const Compact = {
  render: () => (
    <Table density="compact">
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Edited by</TableHead>
          <TableHead>Edited at</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sampleRows.map((row) => (
          <TableRow key={row.name}>
            <TableCell>{row.name}</TableCell>
            <TableCell>{row.type}</TableCell>
            <TableCell>{row.editedBy}</TableCell>
            <TableCell>{row.editedAt}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

// ── Selected row ────────────────────────────────────────────────────────────

export const SelectedRow = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Edited by</TableHead>
          <TableHead>Edited at</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sampleRows.map((row, i) => (
          <TableRow key={row.name} data-state={i === 1 ? 'selected' : undefined}>
            <TableCell>{row.name}</TableCell>
            <TableCell>{row.type}</TableCell>
            <TableCell>{row.editedBy}</TableCell>
            <TableCell>{row.editedAt}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

// ── With Footer ─────────────────────────────────────────────────────────────

export const WithFooter = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Item</TableHead>
          <TableHead>Quantity</TableHead>
          <TableHead>Price</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Apples</TableCell>
          <TableCell>3</TableCell>
          <TableCell>$3.00</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Oranges</TableCell>
          <TableCell>2</TableCell>
          <TableCell>$4.00</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell>Total</TableCell>
          <TableCell>5</TableCell>
          <TableCell>$7.00</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  ),
};

// ── With Caption ────────────────────────────────────────────────────────────

export const WithCaption = {
  render: () => (
    <Table>
      <TableCaption>A list of recent apps from your workspace.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Edited by</TableHead>
          <TableHead>Edited at</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sampleRows.slice(0, 3).map((row) => (
          <TableRow key={row.name}>
            <TableCell>{row.name}</TableCell>
            <TableCell>{row.editedBy}</TableCell>
            <TableCell>{row.editedAt}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};
