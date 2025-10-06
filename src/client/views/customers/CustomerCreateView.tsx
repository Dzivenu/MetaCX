"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOrganization } from "@clerk/nextjs";
import { useCustomers } from "@/client/hooks/useCustomers";
import { useForm } from "@mantine/form";
import {
  Button,
  Grid,
  Group,
  Title,
  TextInput,
  Text,
  Alert,
  Paper,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { IconInfoCircle, IconBuilding } from "@tabler/icons-react";
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

  const form = useForm({
    initialValues: {
      firstName: "",
      lastName: "",
      title: "",
      middleName: "",
      dob: null as Date | null,
      occupation: "",
      employer: "",
      telephone: "",
      email: "",
    },
    validate: {
      firstName: (v) => (v?.trim() ? null : "First name is required"),
      lastName: (v) => (v?.trim() ? null : "Last name is required"),
      dob: (v) => (v ? null : "Date of birth is required"),
    },
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = form.onSubmit(async (values) => {
    // Prevent submission if no organization (safety check)
    if (isOrgDisabled) {
      setError("Please select an organization to create customers.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
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
      }
    } catch (err) {
      console.error("Error creating customer:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create customer";
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  });

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
        <form onSubmit={onSubmit}>
          <Grid gutter="md">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label="First Name"
                required
                disabled={isOrgDisabled || submitting}
                {...form.getInputProps("firstName")}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label="Last Name"
                required
                disabled={isOrgDisabled || submitting}
                {...form.getInputProps("lastName")}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label="Title"
                disabled={isOrgDisabled || submitting}
                {...form.getInputProps("title")}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label="Middle Name"
                disabled={isOrgDisabled || submitting}
                {...form.getInputProps("middleName")}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <DateInput
                label="Date of Birth"
                placeholder="Select date"
                required
                disabled={isOrgDisabled || submitting}
                value={form.values.dob}
                onChange={(d) => form.setFieldValue("dob", d as Date | null)}
                error={form.errors.dob}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label="Occupation"
                disabled={isOrgDisabled || submitting}
                {...form.getInputProps("occupation")}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label="Employer"
                disabled={isOrgDisabled || submitting}
                {...form.getInputProps("employer")}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label="Telephone"
                disabled={isOrgDisabled || submitting}
                {...form.getInputProps("telephone")}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                type="email"
                label="Email"
                disabled={isOrgDisabled || submitting}
                {...form.getInputProps("email")}
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <Group justify="flex-start" mt="sm">
                <Button
                  type="submit"
                  loading={submitting}
                  disabled={isOrgDisabled}
                  title={
                    isOrgDisabled
                      ? "Please select an organization first"
                      : undefined
                  }
                >
                  {submitting ? "Creating..." : "Create Customer"}
                </Button>
                <Button
                  variant="default"
                  type="button"
                  onClick={() => history.back()}
                >
                  Back
                </Button>
              </Group>
              <Text size="sm" c="dimmed" mt="md">
                After creating the customer, you'll be able to add addresses on
                the customer detail page.
              </Text>
            </Grid.Col>
          </Grid>
        </form>
      </Paper>
    </div>
  );
}
