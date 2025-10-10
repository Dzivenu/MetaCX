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
import { useForm } from "@mantine/form";
import { useOrgAddresses } from "@/client/hooks/useOrgAddressesConvex";
import type { OrgCustomer } from "@/client/hooks/useOrgCustomersConvex";

interface CustomerAddressModalProps {
  customer: OrgCustomer;
  opened: boolean;
  onClose: () => void;
  addressToEdit?: any; // Existing address to edit, or undefined for create
}

export function CustomerAddressModal({
  customer,
  opened,
  onClose,
  addressToEdit,
}: CustomerAddressModalProps) {
  const { createOrgAddress, updateOrgAddress } = useOrgAddresses();
  const isEditing = !!addressToEdit;

  const form = useForm({
    initialValues: {
      addressType: addressToEdit?.addressType || "home",
      line1: addressToEdit?.line1 || "",
      line2: addressToEdit?.line2 || "",
      city: addressToEdit?.city || "",
      stateCode: addressToEdit?.stateCode || "",
      stateName: addressToEdit?.stateName || "",
      postalCode: addressToEdit?.postalCode || "",
      countryCode: addressToEdit?.countryCode || "US",
      countryName: addressToEdit?.countryName || "United States",
      primary: addressToEdit?.primary || false,
      active: addressToEdit?.active !== false,
      notes: addressToEdit?.notes || "",
    },
    validate: {
      line1: (value) => (!value?.trim() ? "Address line 1 is required" : null),
      city: (value) => (!value?.trim() ? "City is required" : null),
      stateCode: (value) => (!value?.trim() ? "State code is required" : null),
      stateName: (value) => (!value?.trim() ? "State name is required" : null),
      postalCode: (value) =>
        !value?.trim() ? "Postal/ZIP code is required" : null,
      countryCode: (value) =>
        !value?.trim() ? "Country code is required" : null,
      countryName: (value) =>
        !value?.trim() ? "Country name is required" : null,
    },
  });

  // Reset form when addressToEdit changes
  useEffect(() => {
    if (opened) {
      form.setValues({
        addressType: addressToEdit?.addressType || "home",
        line1: addressToEdit?.line1 || "",
        line2: addressToEdit?.line2 || "",
        city: addressToEdit?.city || "",
        stateCode: addressToEdit?.stateCode || "",
        stateName: addressToEdit?.stateName || "",
        postalCode: addressToEdit?.postalCode || "",
        countryCode: addressToEdit?.countryCode || "US",
        countryName: addressToEdit?.countryName || "United States",
        primary: addressToEdit?.primary || false,
        active: addressToEdit?.active !== false,
        notes: addressToEdit?.notes || "",
      });
    }
  }, [addressToEdit, opened]);

  const handleSubmit = form.onSubmit(async (values) => {
    try {
      if (isEditing) {
        await updateOrgAddress(addressToEdit._id, {
          addressType: values.addressType,
          line1: values.line1,
          line2: values.line2 || undefined,
          city: values.city,
          stateCode: values.stateCode,
          stateName: values.stateName,
          postalCode: values.postalCode,
          countryCode: values.countryCode,
          countryName: values.countryName,
          primary: values.primary,
          active: values.active,
        });
      } else {
        await createOrgAddress({
          parentType: "org_customers",
          parentId: customer.id,
          addressType: values.addressType,
          line1: values.line1,
          line2: values.line2 || undefined,
          city: values.city,
          stateCode: values.stateCode,
          stateName: values.stateName,
          postalCode: values.postalCode,
          countryCode: values.countryCode,
          countryName: values.countryName,
          primary: values.primary,
        });
      }
      handleClose();
    } catch (error) {
      console.error("Failed to save address:", error);
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
      title={isEditing ? "Edit Address" : "Add Address"}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <Grid>
          <Grid.Col span={12}>
            <Select
              label="Address Type"
              data={[
                { value: "home", label: "Home" },
                { value: "work", label: "Work" },
                { value: "mailing", label: "Mailing" },
                { value: "billing", label: "Billing" },
                { value: "shipping", label: "Shipping" },
                { value: "business", label: "Business" },
              ]}
              {...form.getInputProps("addressType")}
            />
          </Grid.Col>

          <Grid.Col span={12}>
            <TextInput
              label="Address Line 1"
              placeholder="Street address"
              withAsterisk
              {...form.getInputProps("line1")}
            />
          </Grid.Col>

          <Grid.Col span={12}>
            <TextInput
              label="Address Line 2"
              placeholder="Apt, Suite, Unit, etc. (optional)"
              {...form.getInputProps("line2")}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label="City"
              placeholder="City"
              withAsterisk
              {...form.getInputProps("city")}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label="State/Province Code"
              placeholder="CA, NY, ON, etc."
              withAsterisk
              {...form.getInputProps("stateCode")}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label="State/Province Name"
              placeholder="California, New York, Ontario, etc."
              withAsterisk
              {...form.getInputProps("stateName")}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label="Postal/ZIP Code"
              placeholder="12345"
              withAsterisk
              {...form.getInputProps("postalCode")}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label="Country Code"
              placeholder="US, CA, GB, etc."
              withAsterisk
              {...form.getInputProps("countryCode")}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label="Country Name"
              placeholder="United States, Canada, etc."
              withAsterisk
              {...form.getInputProps("countryName")}
            />
          </Grid.Col>

          <Grid.Col span={12}>
            <Textarea
              label="Notes"
              placeholder="Additional notes about this address (optional)"
              {...form.getInputProps("notes")}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <Checkbox
              label="Primary Address"
              {...form.getInputProps("primary", { type: "checkbox" })}
            />
          </Grid.Col>

          {isEditing && (
            <Grid.Col span={{ base: 12, md: 6 }}>
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
                {isEditing ? "Save Changes" : "Add Address"}
              </Button>
            </Group>
          </Grid.Col>
        </Grid>
      </form>
    </Modal>
  );
}
