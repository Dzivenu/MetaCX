"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOrganization } from "@clerk/nextjs";
import { useCustomers } from "@/client/hooks/useCustomers";
import { Button, Group, Title, Text, Alert, Paper } from "@mantine/core";
import { IconInfoCircle, IconBuilding } from "@tabler/icons-react";
import {
  CustomerForm,
  type CustomerFormValues,
} from "@/client/components/customers";
import dayjs from "dayjs";

interface Props {
  basePath?: string; // e.g. "/admin/customers" or "/portal/customers"
}

export default function CustomerCreateView({ basePath = "" }: Props) {
  const router = useRouter();
  const { organization, isLoaded: orgLoaded } = useOrganization();
  const { createCustomer } = useCustomers();

  // Check if organization functionality should be disabled (following AppLayout pattern)
  const isOrgDisabled = !organization;

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: CustomerFormValues) => {
    // Prevent submission if no organization (safety check)
    if (isOrgDisabled) {
      setError("Please select an organization to create customers.");
      throw new Error("Please select an organization to create customers.");
    }

    setError(null);

    const payload = {
      firstName: values.firstName,
      lastName: values.lastName,
      title: values.title,
      middleName: values.middleName,
      dob: values.dob ? dayjs(values.dob).format("YYYY-MM-DD") : undefined,
      occupation: values.occupation,
      employer: values.employer,
      telephone: values.telephone,
      email: values.email,
    };

    const created = await createCustomer(payload);
    if (created) {
      // Redirect to customer detail page where addresses can be added
      router.push(`${basePath}/${created.id}`);
    } else {
      setError("Failed to create customer. Please try again.");
      throw new Error("Failed to create customer. Please try again.");
    }
  };

  return (
    <div>
      <Title order={2} mb="md">
        Create Customer
      </Title>

      {/* Organization Status Alert (following AppLayout pattern) */}
      {isOrgDisabled && (
        <Alert
          icon={<IconInfoCircle size={16} />}
          color="blue"
          mb="md"
          title="Organization Required"
        >
          <Text size="sm" mb="xs">
            Please select an organization to create customers. You can use the
            organization switcher in the top navigation bar.
          </Text>
          <Group gap="sm">
            <Button
              size="xs"
              variant="light"
              leftSection={<IconBuilding size={14} />}
              onClick={() => router.push("/organizations")}
            >
              Manage Organizations
            </Button>
          </Group>
        </Alert>
      )}

      {error && (
        <Text c="red" mb="sm">
          {error}
        </Text>
      )}
      <Paper withBorder p="md" style={{ opacity: isOrgDisabled ? 0.6 : 1 }}>
        <CustomerForm
          onSubmit={handleSubmit}
          onCancel={() => history.back()}
          submitLabel="Create Customer"
        />
        <Text size="sm" c="dimmed" mt="md">
          After creating the customer, you'll be able to add addresses on the
          customer detail page.
        </Text>
      </Paper>
    </div>
  );
}
