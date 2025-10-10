"use client";

import React, { useEffect, useState, useMemo } from "react";
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
import countriesStatesData from "@/client/data/countries-states.json";

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
  const [selectedCountry, setSelectedCountry] = useState<string>(
    addressToEdit?.countryCode || "US"
  );
  const [isOtherState, setIsOtherState] = useState(false);

  // Get country options
  const countryOptions = useMemo(
    () =>
      countriesStatesData.countries.map((country) => ({
        value: country.code,
        label: country.name,
      })),
    []
  );

  // Get state options based on selected country
  const stateOptions = useMemo(() => {
    const country = countriesStatesData.countries.find(
      (c) => c.code === selectedCountry
    );
    if (!country) return [];

    const states = country.states.map((state) => ({
      value: state.code,
      label: state.name,
    }));

    // Add "Other" option at the end
    states.push({ value: "OTHER", label: "Other (Enter Manually)" });

    return states;
  }, [selectedCountry]);

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
      primary: addressToEdit?.primary || false,
      active: addressToEdit?.active !== false,
      notes: addressToEdit?.notes || "",
    },
    validate: {
      line1: (value) => (!value?.trim() ? "Address line 1 is required" : null),
      city: (value) => (!value?.trim() ? "City is required" : null),
      postalCode: (value) =>
        !value?.trim() ? "Postal/ZIP code is required" : null,
      countryCode: (value) => (!value ? "Country is required" : null),
      stateCode: (value, values) => {
        if (isOtherState && !values.stateName?.trim()) {
          return "State name is required";
        }
        if (!isOtherState && !value?.trim()) {
          return "State is required";
        }
        return null;
      },
    },
  });

  // Reset form when addressToEdit changes
  useEffect(() => {
    if (opened) {
      const countryCode = addressToEdit?.countryCode || "US";
      setSelectedCountry(countryCode);

      // Check if the state is in the list or if it's "OTHER"
      const country = countriesStatesData.countries.find(
        (c) => c.code === countryCode
      );
      const stateExists = country?.states.some(
        (s) => s.code === addressToEdit?.stateCode
      );
      setIsOtherState(addressToEdit?.stateCode && !stateExists ? true : false);

      form.setValues({
        addressType: addressToEdit?.addressType || "home",
        line1: addressToEdit?.line1 || "",
        line2: addressToEdit?.line2 || "",
        city: addressToEdit?.city || "",
        stateCode: stateExists ? addressToEdit?.stateCode || "" : "OTHER",
        stateName: addressToEdit?.stateName || "",
        postalCode: addressToEdit?.postalCode || "",
        countryCode: countryCode,
        primary: addressToEdit?.primary || false,
        active: addressToEdit?.active !== false,
        notes: addressToEdit?.notes || "",
      });
    }
  }, [addressToEdit, opened]);

  // Handle country change
  const handleCountryChange = (value: string | null) => {
    if (value) {
      setSelectedCountry(value);
      const country = countriesStatesData.countries.find(
        (c) => c.code === value
      );
      form.setFieldValue("countryCode", value);
      // Reset state when country changes
      form.setFieldValue("stateCode", "");
      form.setFieldValue("stateName", "");
      setIsOtherState(false);
    }
  };

  // Handle state change
  const handleStateChange = (value: string | null) => {
    if (value === "OTHER") {
      setIsOtherState(true);
      form.setFieldValue("stateCode", "OTHER");
      form.setFieldValue("stateName", "");
    } else if (value) {
      setIsOtherState(false);
      form.setFieldValue("stateCode", value);
      // Find and set the state name
      const country = countriesStatesData.countries.find(
        (c) => c.code === selectedCountry
      );
      const state = country?.states.find((s) => s.code === value);
      if (state) {
        form.setFieldValue("stateName", state.name);
      }
    }
  };

  const handleSubmit = form.onSubmit(async (values) => {
    try {
      // Get country name from the selected country code
      const country = countriesStatesData.countries.find(
        (c) => c.code === values.countryCode
      );
      const countryName = country?.name || values.countryCode;

      // Use stateCode and stateName appropriately
      const finalStateCode = isOtherState ? "OTHER" : values.stateCode;
      const finalStateName = values.stateName;

      if (isEditing) {
        await updateOrgAddress(addressToEdit._id, {
          addressType: values.addressType,
          line1: values.line1,
          line2: values.line2 || undefined,
          city: values.city,
          stateCode: finalStateCode,
          stateName: finalStateName,
          postalCode: values.postalCode,
          countryCode: values.countryCode,
          countryName: countryName,
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
          stateCode: finalStateCode,
          stateName: finalStateName,
          postalCode: values.postalCode,
          countryCode: values.countryCode,
          countryName: countryName,
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
            <Select
              label="Country"
              placeholder="Select country"
              withAsterisk
              data={countryOptions}
              value={form.values.countryCode}
              onChange={handleCountryChange}
              searchable
              error={form.errors.countryCode}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <Select
              label="State/Province"
              placeholder="Select state or province"
              withAsterisk
              data={stateOptions}
              value={form.values.stateCode}
              onChange={handleStateChange}
              searchable
              error={form.errors.stateCode}
            />
          </Grid.Col>

          {isOtherState && (
            <Grid.Col span={12}>
              <TextInput
                label="State/Province Name (Other)"
                placeholder="Enter state or province name"
                withAsterisk
                {...form.getInputProps("stateName")}
              />
            </Grid.Col>
          )}

          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label="Postal/ZIP Code"
              placeholder="12345"
              withAsterisk
              {...form.getInputProps("postalCode")}
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
