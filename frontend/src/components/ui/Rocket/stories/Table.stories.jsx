import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../table';

export default {
  title: 'UI/Rocket/Table',
  component: Table,
  tags: ['autodocs'],
};

export const Default = () => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Name</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Role</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow>
        <TableCell>John Doe</TableCell>
        <TableCell>Active</TableCell>
        <TableCell>Admin</TableCell>
      </TableRow>
      <TableRow>
        <TableCell>Jane Smith</TableCell>
        <TableCell>Active</TableCell>
        <TableCell>User</TableCell>
      </TableRow>
    </TableBody>
  </Table>
);





