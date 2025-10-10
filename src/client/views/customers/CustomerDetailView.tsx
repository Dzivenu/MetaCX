"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useOrganization } from "@clerk/nextjs";
import {
  Button,
  Group,
  Loader,
  Text,
  Title,
  Alert,
  Grid,
  Stack,
} from "@mantine/core";
import { IconInfoCircle, IconBuilding } from "@tabler/icons-react";
import { useOrgCustomers } from "@/client/hooks/useOrgCustomersConvex";
import {
  CustomerBioCard,
  CustomerAddressCard,
  CustomerIdentificationCard,
} from "@/client/components/customers";
import type { OrgCustomer } from "@/client/hooks/useOrgCustomersConvex";

interface Props {
  basePath?: string; // e.g. "/admin/customers" or "/portal/customers"
}

export default function CustomerDetailView({ basePath = "" }: Props) {
  const params = useParams<{ id: string }>();
  const id = (params?.id as string) || "";
  const { organization } = useOrganization();
  const { orgCustomers, loading: orgCustomersLoading } = useOrgCustomers(200);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orgCustomer, setOrgCustomer] = useState<OrgCustomer | null>(null);

  // Check if organization functionality should be disabled
  const isOrgDisabled = !organization;

  useEffect(() => {
    const load = async () => {
      if (isOrgDisabled) {
        setError("Please select an organization to view customers.");
        setLoading(false);
        return;
      }

      if (!orgCustomersLoading) {
        const customer = orgCustomers.find((c) => c.id === id);
        setOrgCustomer(customer || null);
        setError(customer ? null : "Customer not found");
        setLoading(false);
      }
    };

    if (id) {
      load();
    }
  }, [id, orgCustomers, isOrgDisabled, orgCustomersLoading]);

  if (!id) return <div>Invalid customer id</div>;

  const handleCustomerUpdate = (updatedCustomer: OrgCustomer) => {
    setOrgCustomer(updatedCustomer);
  };

  return (
    <div>
      <Group justify="space-between" mb="md">
        <Title order={2}>Customer #{id}</Title>
        <Button component={Link} href={basePath} variant="default">
          Back to Customers
        </Button>
      </Group>

      {/* Organization Status Alert */}
      {isOrgDisabled && (
        <Alert
          icon={<IconInfoCircle size={16} />}
          color="blue"
          mb="md"
          title="Organization Required"
        >
          <Text size="sm" mb="xs">
            Please select an organization to view customer details. You can use
            the organization switcher in the top navigation bar.
          </Text>
          <Group gap="sm">
            <Button
              size="xs"
              variant="light"
              leftSection={<IconBuilding size={14} />}
              component={Link}
              href="/organizations"
            >
              Manage Organizations
            </Button>
          </Group>
        </Alert>
      )}

      {loading && (
        <Group gap="sm">
          <Loader size="sm" />
          <Text>Loading...</Text>
        </Group>
      )}
      {error && !isOrgDisabled && <Text c="red">{error}</Text>}

      {/* Customer Information Cards - All inline in one row */}
      {!loading && orgCustomer && !isOrgDisabled && (
        <Stack gap="md">
          <Title order={3}>Customer Information</Title>
          <Grid>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <CustomerBioCard
                customer={orgCustomer}
                showTitle={false}
                onCustomerUpdate={handleCustomerUpdate}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <CustomerAddressCard customer={orgCustomer} showTitle={false} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <CustomerIdentificationCard
                customer={orgCustomer}
                showTitle={false}
              />
            </Grid.Col>
          </Grid>
        </Stack>
      )}
    </div>
  );
}
