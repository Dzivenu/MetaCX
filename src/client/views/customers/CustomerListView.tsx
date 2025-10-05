'use client';

import Link from 'next/link';
import { useCustomers } from '@/client/hooks/useCustomers';
import { Button, Group, Loader, Table, Title } from '@mantine/core';

interface Props {
  basePath?: string; // e.g. "/admin/customers" or "/portal/customers"
}

export default function CustomerListView({ basePath = '' }: Props) {
  const { customers, loading, error, refresh } = useCustomers();

  return (
    <div>
      <Group justify="space-between" mb="md">
        <Title order={2}>Customers</Title>
        <Group gap="xs">
          <Button variant="default" onClick={refresh}>Refresh</Button>
          <Button component={Link} href={`${basePath}/create`}>Create</Button>
        </Group>
      </Group>

      {loading && (
        <Group justify="flex-start" gap="sm">
          <Loader size="sm" />
          <span>Loading...</span>
        </Group>
      )}
      {error && <div className="text-red-600">{error}</div>}

      {!loading && customers.length === 0 && (
        <div>No customers found.</div>
      )}

      {!loading && customers.length > 0 && (
        <Table striped withTableBorder withColumnBorders highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>DOB</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th>Telephone</Table.Th>
              <Table.Th>Blacklisted</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {customers.map((c) => (
              <Table.Tr key={c.id}>
                <Table.Td>{c.firstName} {c.lastName}</Table.Td>
                <Table.Td>{c.dob || '-'}</Table.Td>
                <Table.Td>{c.email || '-'}</Table.Td>
                <Table.Td>{c.telephone || '-'}</Table.Td>
                <Table.Td>{c.blacklisted ? 'Yes' : 'No'}</Table.Td>
                <Table.Td>
                  <Button component={Link} href={`${basePath}/${c.id}`} variant="subtle" size="xs">
                    View
                  </Button>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </div>
  );
}

