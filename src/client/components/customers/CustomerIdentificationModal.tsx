"use client";

import React, { useEffect } from "react";
import {
  Modal,
  Button,
  Grid,
  TextInput,
  Select,
  Checkbox,
  Group,
  Textarea,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useOrgIdentifications } from "@/client/hooks/useOrgIdentifications";
import type { OrgCustomer } from "@/client/hooks/useOrgCustomersConvex";
import type { Id } from "../../../../convex/_generated/dataModel";

interface CustomerIdentificationModalProps {
  customer: OrgCustomer;
  opened: boolean;
  onClose: () => void;
  identificationToEdit?: any; // Existing identification to edit, or undefined for create
}

export function CustomerIdentificationModal({
  customer,
  opened,
  onClose,
  identificationToEdit,
}: CustomerIdentificationModalProps) {
  const { createItem, updateItem } = useOrgIdentifications({
    orgCustomerId: customer.id as Id<"org_customers">,
  });
  const isEditing = !!identificationToEdit;

  const form = useForm({
    initialValues: {
      typeOf: identificationToEdit?.typeOf || "PASSPORT",
      referenceNumber: identificationToEdit?.referenceNumber || "",
      issuingCountryCode: identificationToEdit?.issuingCountryCode || "",
      issuingCountryName: identificationToEdit?.issuingCountryName || "",
      issuingStateCode: identificationToEdit?.issuingStateCode || "",
      issuingStateName: identificationToEdit?.issuingStateName || "",
      issueDate: identificationToEdit?.issueDate
        ? new Date(identificationToEdit.issueDate)
        : null,
      expiryDate: identificationToEdit?.expiryDate
        ? new Date(identificationToEdit.expiryDate)
        : null,
      description: identificationToEdit?.description || "",
      verified: identificationToEdit?.verified || false,
      primary: identificationToEdit?.primary || false,
      active: identificationToEdit?.active !== false,
    },
    validate: {
      typeOf: (value) => (!value?.trim() ? "Document type is required" : null),
      referenceNumber: (value) =>
        !value?.trim() ? "Document number is required" : null,
    },
  });

  // Reset form when identificationToEdit changes
  useEffect(() => {
    if (opened) {
      form.setValues({
        typeOf: identificationToEdit?.typeOf || "PASSPORT",
        referenceNumber: identificationToEdit?.referenceNumber || "",
        issuingCountryCode: identificationToEdit?.issuingCountryCode || "",
        issuingCountryName: identificationToEdit?.issuingCountryName || "",
        issuingStateCode: identificationToEdit?.issuingStateCode || "",
        issuingStateName: identificationToEdit?.issuingStateName || "",
        issueDate: identificationToEdit?.issueDate
          ? new Date(identificationToEdit.issueDate)
          : null,
        expiryDate: identificationToEdit?.expiryDate
          ? new Date(identificationToEdit.expiryDate)
          : null,
        description: identificationToEdit?.description || "",
        verified: identificationToEdit?.verified || false,
        primary: identificationToEdit?.primary || false,
        active: identificationToEdit?.active !== false,
      });
    }
  }, [identificationToEdit, opened]);

  const handleSubmit = form.onSubmit(async (values) => {
    try {
      const data = {
        orgCustomerId: customer.id as Id<"org_customers">,
        typeOf: values.typeOf,
        referenceNumber: values.referenceNumber,
        issuingCountryCode: values.issuingCountryCode || undefined,
        issuingCountryName: values.issuingCountryName || undefined,
        issuingStateCode: values.issuingStateCode || undefined,
        issuingStateName: values.issuingStateName || undefined,
        issueDate: values.issueDate ? values.issueDate.getTime() : undefined,
        expiryDate: values.expiryDate ? values.expiryDate.getTime() : undefined,
        description: values.description || undefined,
        verified: values.verified,
        primary: values.primary,
      };

      if (isEditing) {
        await updateItem({
          id: identificationToEdit._id,
          ...data,
          active: values.active,
        });
      } else {
        await createItem(data);
      }
      handleClose();
    } catch (error) {
      console.error("Failed to save identification:", error);
    }
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={isEditing ? "Edit Identification" : "Add Identification"}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <Grid>
          <Grid.Col span={12}>
            <Select
              label="Document Type"
              withAsterisk
              data={[
                { value: "PASSPORT", label: "Passport" },
                { value: "DRIVING_LICENSE", label: "Driving License" },
                { value: "NATIONAL_ID", label: "National ID" },
                { value: "RESIDENCY_CARD", label: "Residency Card" },
                { value: "BIRTH_CERTIFICATE", label: "Birth Certificate" },
                { value: "OTHER", label: "Other" },
              ]}
              {...form.getInputProps("typeOf")}
            />
          </Grid.Col>

          <Grid.Col span={12}>
            <TextInput
              label="Document Number"
              placeholder="Enter document/reference number"
              withAsterisk
              {...form.getInputProps("referenceNumber")}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label="Issuing Country Code"
              placeholder="US, CA, GB, etc."
              {...form.getInputProps("issuingCountryCode")}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label="Issuing Country Name"
              placeholder="United States, Canada, etc."
              {...form.getInputProps("issuingCountryName")}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label="Issuing State/Province Code"
              placeholder="CA, NY, ON, etc."
              {...form.getInputProps("issuingStateCode")}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label="Issuing State/Province Name"
              placeholder="California, New York, etc."
              {...form.getInputProps("issuingStateName")}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <DateInput
              label="Issue Date"
              placeholder="Select issue date"
              {...form.getInputProps("issueDate")}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <DateInput
              label="Expiry Date"
              placeholder="Select expiry date"
              {...form.getInputProps("expiryDate")}
            />
          </Grid.Col>

          <Grid.Col span={12}>
            <Textarea
              label="Description/Notes"
              placeholder="Additional notes about this document (optional)"
              {...form.getInputProps("description")}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <Checkbox
              label="Verified"
              {...form.getInputProps("verified", { type: "checkbox" })}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <Checkbox
              label="Primary"
              {...form.getInputProps("primary", { type: "checkbox" })}
            />
          </Grid.Col>

          {isEditing && (
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Checkbox
                label="Active"
                {...form.getInputProps("active", { type: "checkbox" })}
              />
            </Grid.Col>
          )}

          <Grid.Col span={12}>
            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={handleClose} type="button">
                Cancel
              </Button>
              <Button type="submit">
                {isEditing ? "Save Changes" : "Add Identification"}
              </Button>
            </Group>
          </Grid.Col>
        </Grid>
      </form>
    </Modal>
  );
}
