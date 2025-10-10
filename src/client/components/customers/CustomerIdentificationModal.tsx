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
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useOrgIdentifications } from "@/client/hooks/useOrgIdentifications";
import type { OrgCustomer } from "@/client/hooks/useOrgCustomersConvex";
import type { Id } from "../../../../convex/_generated/dataModel";
import countriesStatesData from "@/client/data/countries-states.json";

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
  const [selectedCountry, setSelectedCountry] = useState<string>(
    identificationToEdit?.issuingCountryCode || "US"
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
      typeOf: identificationToEdit?.typeOf || "PASSPORT",
      referenceNumber: identificationToEdit?.referenceNumber || "",
      issuingCountryCode: identificationToEdit?.issuingCountryCode || "US",
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
      const countryCode = identificationToEdit?.issuingCountryCode || "US";
      setSelectedCountry(countryCode);

      // Check if the state is in the list or if it's "OTHER"
      const country = countriesStatesData.countries.find(
        (c) => c.code === countryCode
      );
      const stateExists = country?.states.some(
        (s) => s.code === identificationToEdit?.issuingStateCode
      );
      setIsOtherState(
        identificationToEdit?.issuingStateCode && !stateExists ? true : false
      );

      form.setValues({
        typeOf: identificationToEdit?.typeOf || "PASSPORT",
        referenceNumber: identificationToEdit?.referenceNumber || "",
        issuingCountryCode: countryCode,
        issuingStateCode: stateExists
          ? identificationToEdit?.issuingStateCode || ""
          : identificationToEdit?.issuingStateCode
            ? "OTHER"
            : "",
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
      });
    }
  }, [identificationToEdit, opened]);

  // Handle country change
  const handleCountryChange = (value: string | null) => {
    if (value) {
      setSelectedCountry(value);
      const country = countriesStatesData.countries.find(
        (c) => c.code === value
      );
      form.setFieldValue("issuingCountryCode", value);
      // Reset state when country changes
      form.setFieldValue("issuingStateCode", "");
      form.setFieldValue("issuingStateName", "");
      setIsOtherState(false);
    }
  };

  // Handle state change
  const handleStateChange = (value: string | null) => {
    if (value === "OTHER") {
      setIsOtherState(true);
      form.setFieldValue("issuingStateCode", "OTHER");
      form.setFieldValue("issuingStateName", "");
    } else if (value) {
      setIsOtherState(false);
      form.setFieldValue("issuingStateCode", value);
      // Find and set the state name
      const country = countriesStatesData.countries.find(
        (c) => c.code === selectedCountry
      );
      const state = country?.states.find((s) => s.code === value);
      if (state) {
        form.setFieldValue("issuingStateName", state.name);
      }
    }
  };

  const handleSubmit = form.onSubmit(async (values) => {
    try {
      // Get country name from the selected country code
      const country = countriesStatesData.countries.find(
        (c) => c.code === values.issuingCountryCode
      );
      const countryName = country?.name || values.issuingCountryCode;

      // Use stateCode and stateName appropriately
      const finalStateCode = isOtherState ? "OTHER" : values.issuingStateCode;
      const finalStateName = values.issuingStateName;

      if (isEditing) {
        // Update - don't send orgCustomerId
        await updateItem({
          id: identificationToEdit._id,
          typeOf: values.typeOf,
          referenceNumber: values.referenceNumber,
          issuingCountryCode: values.issuingCountryCode || undefined,
          issuingCountryName: countryName || undefined,
          issuingStateCode: finalStateCode || undefined,
          issuingStateName: finalStateName || undefined,
          issueDate:
            values.issueDate && values.issueDate instanceof Date
              ? values.issueDate.getTime()
              : undefined,
          expiryDate:
            values.expiryDate && values.expiryDate instanceof Date
              ? values.expiryDate.getTime()
              : undefined,
          description: values.description || undefined,
          verified: values.verified,
          primary: values.primary,
        });
      } else {
        // Create - include orgCustomerId
        await createItem({
          orgCustomerId: customer.id as Id<"org_customers">,
          typeOf: values.typeOf,
          referenceNumber: values.referenceNumber,
          issuingCountryCode: values.issuingCountryCode || undefined,
          issuingCountryName: countryName || undefined,
          issuingStateCode: finalStateCode || undefined,
          issuingStateName: finalStateName || undefined,
          issueDate:
            values.issueDate && values.issueDate instanceof Date
              ? values.issueDate.getTime()
              : undefined,
          expiryDate:
            values.expiryDate && values.expiryDate instanceof Date
              ? values.expiryDate.getTime()
              : undefined,
          description: values.description || undefined,
          verified: values.verified,
          primary: values.primary,
        });
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
            <Select
              label="Issuing Country"
              placeholder="Select country"
              data={countryOptions}
              value={form.values.issuingCountryCode}
              onChange={handleCountryChange}
              searchable
              error={form.errors.issuingCountryCode}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <Select
              label="Issuing State/Province"
              placeholder="Select state or province"
              data={stateOptions}
              value={form.values.issuingStateCode}
              onChange={handleStateChange}
              searchable
              error={form.errors.issuingStateCode}
            />
          </Grid.Col>

          {isOtherState && (
            <Grid.Col span={12}>
              <TextInput
                label="State/Province Name (Other)"
                placeholder="Enter state or province name"
                {...form.getInputProps("issuingStateName")}
              />
            </Grid.Col>
          )}

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

          <Grid.Col span={{ base: 12, md: 6 }}>
            <Checkbox
              label="Verified"
              {...form.getInputProps("verified", { type: "checkbox" })}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <Checkbox
              label="Primary"
              {...form.getInputProps("primary", { type: "checkbox" })}
            />
          </Grid.Col>

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
