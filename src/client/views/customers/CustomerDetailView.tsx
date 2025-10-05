"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useOrganization } from "@clerk/nextjs";
import { useCustomers } from "@/client/hooks/useCustomers";
import { type Customer } from "@/client/api/customers";
import {
  Badge,
  Button,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Text,
  Title,
  Alert,
  Modal,
  Grid,
  TextInput,
  Checkbox,
} from "@mantine/core";
import { IconInfoCircle, IconBuilding } from "@tabler/icons-react";
import { AddressList } from "@/client/components/addresses";
import { IdentificationList } from "@/client/components/identifications";
import { useOrgCustomers } from "@/client/hooks/useOrgCustomersConvex";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";

interface Props {
  basePath?: string; // e.g. "/admin/customers" or "/portal/customers"
}

export default function CustomerDetailView({ basePath = "" }: Props) {
  const params = useParams<{ id: string }>();
  const id = (params?.id as string) || "";
  const { organization } = useOrganization();
  const { customers, loading: customersLoading, getCustomer } = useCustomers();
  const { updateOrgCustomer } = useOrgCustomers();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Check if organization functionality should be disabled
  const isOrgDisabled = !organization;

  useEffect(() => {
    const load = async () => {
      if (isOrgDisabled) {
        setError("Please select an organization to view customers.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const customerData = await getCustomer(id);
        setCustomer(customerData);
        setError(customerData ? null : "Customer not found");
      } catch (e) {
        console.error("Failed to load customer", e);
        setError("Failed to load customer");
      } finally {
        setLoading(false);
      }
    };

    if (id && !customersLoading) {
      load();
    }
  }, [id, getCustomer, isOrgDisabled, customersLoading]);

  if (!id) return <div>Invalid customer id</div>;

  const parseDobToDate = (dob?: string | null) => {
    if (!dob) return null;
    const d = new Date(dob);
    return isNaN(d.getTime()) ? null : d;
  };

  const toDobTimestamp = (val: Date | null): number | undefined => {
    if (!val) return undefined;
    return val.getTime();
  };

  const editForm = useForm({
    initialValues: {
      title: customer?.title || "",
      firstName: customer?.firstName || "",
      middleName: customer?.middleName || "",
      lastName: customer?.lastName || "",
      dob: parseDobToDate(customer?.dob || null) as Date | null,
      email: customer?.email || "",
      telephone: customer?.telephone || "",
      occupation: customer?.occupation || "",
      employer: customer?.employer || "",
      active: customer?.active ?? true,
      blacklisted: customer?.blacklisted ?? false,
    },
    validate: {
      firstName: (v) => (!v?.trim() ? "First name is required" : null),
      lastName: (v) => (!v?.trim() ? "Last name is required" : null),
    },
  });

  const openEdit = () => {
    if (!customer) return;
    editForm.setValues({
      title: customer.title || "",
      firstName: customer.firstName || "",
      middleName: customer.middleName || "",
      lastName: customer.lastName || "",
      dob: parseDobToDate(customer.dob || null),
      email: customer.email || "",
      telephone: customer.telephone || "",
      occupation: customer.occupation || "",
      employer: customer.employer || "",
      active: customer.active ?? true,
      blacklisted: customer.blacklisted ?? false,
    });
    setIsEditOpen(true);
  };

  const submitEdit = editForm.onSubmit(async (values) => {
    if (!customer) return;
    const updated = await updateOrgCustomer(customer.id, {
      title: values.title || undefined,
      firstName: values.firstName,
      middleName: values.middleName || undefined,
      lastName: values.lastName,
      dob: toDobTimestamp(values.dob),
      email: values.email || undefined,
      telephone: values.telephone || undefined,
      occupation: values.occupation || undefined,
      employer: values.employer || undefined,
      active: values.active,
      blacklisted: values.blacklisted,
    });
    if (updated) {
      // Merge into local legacy Customer shape
      setCustomer((prev) =>
        prev
          ? {
              ...prev,
              title: updated.title,
              firstName: updated.firstName,
              middleName: updated.middleName,
              lastName: updated.lastName,
              dob: values.dob ? values.dob.toISOString().split("T")[0] : null,
              email: updated.email || null,
              telephone: updated.telephone || null,
              occupation: updated.occupation || null,
              employer: updated.employer || null,
              active: updated.active ?? prev.active,
              blacklisted: updated.blacklisted ?? prev.blacklisted,
              updatedAt: new Date().toISOString(),
            }
          : prev
      );
      setIsEditOpen(false);
    }
  });

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
      {!loading && customer && !isOrgDisabled && (
        <Paper
          withBorder
          p="md"
          radius="md"
          style={{ opacity: isOrgDisabled ? 0.6 : 1 }}
        >
          <Group justify="space-between" mb="sm">
            <Text fw={600}>Customer Bio</Text>
            <Button size="xs" variant="outline" onClick={openEdit}>
              Edit
            </Button>
          </Group>
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            <div>
              <Text size="sm" c="dimmed">
                Name
              </Text>
              <Text fw={500}>
                {customer.firstName} {customer.lastName}
              </Text>
            </div>
            <div>
              <Text size="sm" c="dimmed">
                DOB
              </Text>
              <Text fw={500}>{customer.dob || "-"}</Text>
            </div>
            <div>
              <Text size="sm" c="dimmed">
                Email
              </Text>
              <Text fw={500}>{customer.email || "-"}</Text>
            </div>
            <div>
              <Text size="sm" c="dimmed">
                Telephone
              </Text>
              <Text fw={500}>{customer.telephone || "-"}</Text>
            </div>
            <div>
              <Text size="sm" c="dimmed">
                Occupation
              </Text>
              <Text fw={500}>{customer.occupation || "-"}</Text>
            </div>
            <div>
              <Text size="sm" c="dimmed">
                Employer
              </Text>
              <Text fw={500}>{customer.employer || "-"}</Text>
            </div>
            <div>
              <Text size="sm" c="dimmed">
                Blacklisted
              </Text>
              <Badge
                color={customer.blacklisted ? "red" : "green"}
                variant="light"
              >
                {customer.blacklisted ? "Yes" : "No"}
              </Badge>
            </div>
            <div>
              <Text size="sm" c="dimmed">
                Active
              </Text>
              <Badge color={customer.active ? "green" : "gray"} variant="light">
                {customer.active ? "Yes" : "No"}
              </Badge>
            </div>
          </SimpleGrid>
        </Paper>
      )}

      <Modal
        opened={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Customer"
        size="lg"
      >
        <form onSubmit={submitEdit}>
          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput label="Title" {...editForm.getInputProps("title")} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label="First Name"
                withAsterisk
                {...editForm.getInputProps("firstName")}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label="Middle Name"
                {...editForm.getInputProps("middleName")}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label="Last Name"
                withAsterisk
                {...editForm.getInputProps("lastName")}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <DateInput
                label="Date of Birth"
                {...editForm.getInputProps("dob")}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label="Email"
                type="email"
                {...editForm.getInputProps("email")}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label="Telephone"
                {...editForm.getInputProps("telephone")}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label="Occupation"
                {...editForm.getInputProps("occupation")}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label="Employer"
                {...editForm.getInputProps("employer")}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Checkbox
                label="Active"
                {...editForm.getInputProps("active", { type: "checkbox" })}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Checkbox
                label="Blacklisted"
                {...editForm.getInputProps("blacklisted", { type: "checkbox" })}
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <Group justify="flex-end" mt="md">
                <Button
                  variant="default"
                  onClick={() => setIsEditOpen(false)}
                  type="button"
                >
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </Group>
            </Grid.Col>
          </Grid>
        </form>
      </Modal>

      {/* Customer Addresses */}
      {!loading && customer && !isOrgDisabled && (
        <Paper
          withBorder
          p="md"
          radius="md"
          mt="md"
          style={{ opacity: isOrgDisabled ? 0.6 : 1 }}
        >
          <AddressList
            parentType="customer"
            parentId={customer.id}
            title="Customer Addresses"
            showAddButton={true}
            allowEdit={true}
            allowDelete={true}
            allowSetPrimary={true}
          />
        </Paper>
      )}

      {/* Customer Identifications */}
      {!loading && customer && !isOrgDisabled && (
        <Paper
          withBorder
          p="md"
          radius="md"
          mt="md"
          style={{ opacity: isOrgDisabled ? 0.6 : 1 }}
        >
          <IdentificationList
            orgCustomerId={customer.id as any}
            title="Customer Identifications"
            showAddButton={true}
          />
        </Paper>
      )}
    </div>
  );
}
