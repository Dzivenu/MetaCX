"use client";

import React from "react";
import { Modal, Button, Grid, TextInput, Checkbox, Group } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useOrgCustomers } from "@/client/hooks/useOrgCustomersConvex";
import type { OrgCustomer } from "@/client/hooks/useOrgCustomersConvex";

interface CustomerEditModalProps {
  customer: OrgCustomer;
  opened: boolean;
  onClose: () => void;
  onSave?: (updatedCustomer: OrgCustomer) => void;
}

// Helper function to convert date to timestamp
const toDobTimestamp = (date: Date | null): number | undefined => {
  if (!date) return undefined;
  return date.getTime();
};

export function CustomerEditModal({
  customer,
  opened,
  onClose,
  onSave,
}: CustomerEditModalProps) {
  const { updateOrgCustomer } = useOrgCustomers();

  const editForm = useForm({
    initialValues: {
      title: customer.title || "",
      firstName: customer.firstName || "",
      middleName: customer.middleName || "",
      lastName: customer.lastName || "",
      dob: customer.dob ? new Date(customer.dob) : null,
      email: customer.email || "",
      telephone: customer.telephone || "",
      occupation: customer.occupation || "",
      employer: customer.employer || "",
      active: !customer.blacklisted,
      blacklisted: customer.blacklisted ?? false,
    },
    validate: {
      firstName: (value) =>
        !value || value.trim().length === 0 ? "First name is required" : null,
      lastName: (value) =>
        !value || value.trim().length === 0 ? "Last name is required" : null,
    },
  });

  // Reset form when customer changes
  React.useEffect(() => {
    editForm.setValues({
      title: customer.title || "",
      firstName: customer.firstName || "",
      middleName: customer.middleName || "",
      lastName: customer.lastName || "",
      dob: customer.dob ? new Date(customer.dob) : null,
      email: customer.email || "",
      telephone: customer.telephone || "",
      occupation: customer.occupation || "",
      employer: customer.employer || "",
      active: !customer.blacklisted,
      blacklisted: customer.blacklisted ?? false,
    });
  }, [customer]);

  const handleSubmit = editForm.onSubmit(async (values) => {
    try {
      const updatedCustomer = await updateOrgCustomer(customer.id, {
        title: values.title || undefined,
        firstName: values.firstName,
        middleName: values.middleName || undefined,
        lastName: values.lastName,
        dob: toDobTimestamp(values.dob),
        email: values.email || undefined,
        telephone: values.telephone || undefined,
        occupation: values.occupation || undefined,
        employer: values.employer || undefined,
        blacklisted: values.blacklisted,
      });

      if (updatedCustomer && onSave) {
        onSave(updatedCustomer);
      }
      onClose();
    } catch (error) {
      console.error("Failed to update customer:", error);
    }
  });

  const handleClose = () => {
    editForm.reset();
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Edit Customer"
      size="lg"
    >
      <form onSubmit={handleSubmit}>
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
              <Button variant="default" onClick={handleClose} type="button">
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </Group>
          </Grid.Col>
        </Grid>
      </form>
    </Modal>
  );
}



