"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  TextInput,
  Button,
  Grid,
  Select,
  Checkbox,
  Alert,
  Autocomplete,
  Text,
  Divider,
  Group,
  Stack,
  Textarea,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import type {
  CreateOrgAddressData,
  OrgAddress,
} from "@/client/hooks/useOrgAddresses";

// US States data
const US_STATES = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
];

// Countries data
const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "MX", name: "Mexico" },
  { code: "GB", name: "United Kingdom" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "JP", name: "Japan" },
  { code: "AU", name: "Australia" },
];

// Address types
const ADDRESS_TYPES = [
  "home",
  "work",
  "business",
  "mailing",
  "billing",
  "shipping",
  "temporary",
  "other",
];

// Form validation is now inline in the useForm hook

interface AddressFormProps {
  initialData?: Partial<OrgAddress>;
  onSubmit: (data: CreateOrgAddressData) => Promise<void>;
  onCancel: () => void;
  submitText?: string;
  showAdvanced?: boolean;
}

export const AddressForm: React.FC<AddressFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  submitText = "Save Address",
  showAdvanced = true,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);

  const form = useForm({
    initialValues: {
      addressType: initialData?.addressType || "",
      line1: initialData?.line1 || "",
      line2: initialData?.line2 || "",
      line3: initialData?.line3 || "",
      city: initialData?.city || "",
      county: initialData?.county || "",
      stateCode: initialData?.stateCode || "",
      stateName: initialData?.stateName || "",
      postalCode: initialData?.postalCode || "",
      countryCode: initialData?.countryCode || "US",
      countryName: initialData?.countryName || "United States",
      primary: initialData?.primary || false,
      verified: initialData?.verified || false,
      deliveryInstructions: initialData?.deliveryInstructions || "",
      accessInstructions: initialData?.accessInstructions || "",
      contactPhone: initialData?.contactPhone || "",
      contactEmail: initialData?.contactEmail || "",
      notes: initialData?.notes || "",
    },
    validate: {
      // Simplified validation - only check required fields
      line1: (value) => (!value?.trim() ? "Street address is required" : null),
      city: (value) => (!value?.trim() ? "City is required" : null),
      stateCode: (value) => (!value?.trim() ? "State is required" : null),
      postalCode: (value) =>
        !value?.trim() ? "Postal code is required" : null,
      countryCode: (value) => (!value?.trim() ? "Country is required" : null),
      contactEmail: (value) => {
        if (!value || !value.trim()) return null;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !emailRegex.test(value) ? "Invalid email" : null;
      },
    },
  });

  const watchedCountryCode = form.values.countryCode;
  const watchedStateCode = form.values.stateCode;

  // Memoized data arrays to prevent infinite re-renders
  const addressTypeOptions = useMemo(
    () =>
      ADDRESS_TYPES.map((type) => ({
        value: type,
        label: type.charAt(0).toUpperCase() + type.slice(1),
      })),
    []
  );

  const stateOptions = useMemo(
    () =>
      US_STATES.map((state) => ({
        value: state.code,
        label: `${state.name} (${state.code})`,
      })),
    []
  );

  const countryOptions = useMemo(
    () =>
      COUNTRIES.map((country) => ({
        value: country.code,
        label: `${country.name} (${country.code})`,
      })),
    []
  );

  // Auto-populate state name when state code changes
  useEffect(() => {
    if (watchedStateCode && watchedCountryCode === "US") {
      const state = US_STATES.find((s) => s.code === watchedStateCode);
      if (state) {
        form.setFieldValue("stateName", state.name);
      }
    }
  }, [watchedStateCode, watchedCountryCode, form]);

  // Auto-populate country name when country code changes
  useEffect(() => {
    if (watchedCountryCode) {
      const country = COUNTRIES.find((c) => c.code === watchedCountryCode);
      if (country) {
        form.setFieldValue("countryName", country.name);
      }
    }
  }, [watchedCountryCode, form]);

  const handleFormSubmit = async (values: any) => {
    console.log("📋 AddressForm handleFormSubmit called with values:", values);
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      console.log("📤 Calling onSubmit with values:", values);
      await onSubmit(values);
      console.log("✅ onSubmit completed successfully");
    } catch (error) {
      console.error("❌ Form submission error:", error);
      setSubmitError(
        error instanceof Error ? error.message : "Failed to save address"
      );
    } finally {
      setIsSubmitting(false);
      console.log("🏁 Form submission finished, isSubmitting set to false");
    }
  };

  return (
    <Box component="form" onSubmit={form.onSubmit(handleFormSubmit)} mt="md">
      {submitError && (
        <Alert color="red" title="Error" mb="md">
          {submitError}
        </Alert>
      )}

      <Grid>
        {/* Address Type */}
        <Grid.Col span={{ base: 12, sm: 6 }}>
          <Select
            label="Address Type"
            placeholder="Select type"
            data={addressTypeOptions}
            clearable
            {...form.getInputProps("addressType")}
          />
        </Grid.Col>

        {/* Primary Address Checkbox */}
        <Grid.Col span={{ base: 12, sm: 6 }}>
          <Checkbox
            label="Primary Address"
            mt="xl"
            {...form.getInputProps("primary", { type: "checkbox" })}
          />
        </Grid.Col>

        {/* Street Address Lines */}
        <Grid.Col span={12}>
          <TextInput
            label="Street Address"
            placeholder="Enter street address"
            withAsterisk
            {...form.getInputProps("line1")}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6 }}>
          <TextInput
            label="Apt, Suite, etc."
            placeholder="Apartment, suite, unit, etc."
            {...form.getInputProps("line2")}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6 }}>
          <TextInput
            label="Additional Address Line"
            placeholder="Additional address information"
            {...form.getInputProps("line3")}
          />
        </Grid.Col>

        {/* City and County */}
        <Grid.Col span={{ base: 12, sm: 8 }}>
          <TextInput
            label="City"
            placeholder="Enter city"
            withAsterisk
            {...form.getInputProps("city")}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 4 }}>
          <TextInput
            label="County"
            placeholder="Enter county"
            {...form.getInputProps("county")}
          />
        </Grid.Col>

        {/* State */}
        <Grid.Col span={{ base: 12, sm: 6 }}>
          {watchedCountryCode === "US" ? (
            <Select
              label="State/Province"
              placeholder="Select state"
              withAsterisk
              data={stateOptions}
              searchable
              {...form.getInputProps("stateCode")}
            />
          ) : (
            <TextInput
              label="State/Province"
              placeholder="Enter state or province"
              withAsterisk
              {...form.getInputProps("stateCode")}
            />
          )}
        </Grid.Col>

        {/* Postal Code */}
        <Grid.Col span={{ base: 12, sm: 6 }}>
          <TextInput
            label="ZIP/Postal Code"
            placeholder="Enter postal code"
            withAsterisk
            {...form.getInputProps("postalCode")}
          />
        </Grid.Col>

        {/* Country */}
        <Grid.Col span={12}>
          <Select
            label="Country"
            placeholder="Select country"
            withAsterisk
            data={countryOptions}
            searchable
            {...form.getInputProps("countryCode")}
          />
        </Grid.Col>

        {/* Contact Information */}
        <Grid.Col span={{ base: 12, sm: 6 }}>
          <TextInput
            label="Contact Phone"
            placeholder="Phone number for this address"
            {...form.getInputProps("contactPhone")}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6 }}>
          <TextInput
            label="Contact Email"
            type="email"
            placeholder="Email for this address"
            {...form.getInputProps("contactEmail")}
          />
        </Grid.Col>

        {/* Advanced Fields Toggle */}
        {showAdvanced && (
          <Grid.Col span={12}>
            <Button
              variant="subtle"
              onClick={() => setShowAdvancedFields(!showAdvancedFields)}
              mb="sm"
            >
              {showAdvancedFields ? "Hide" : "Show"} Advanced Options
            </Button>
          </Grid.Col>
        )}

        {/* Advanced Fields */}
        {showAdvancedFields && (
          <>
            <Grid.Col span={12}>
              <Divider my="md" />
              <Text size="sm" c="dimmed" mb="xs">
                Additional Information
              </Text>
            </Grid.Col>

            <Grid.Col span={12}>
              <Textarea
                label="Delivery Instructions"
                placeholder="Special instructions for delivery"
                autosize
                minRows={2}
                {...form.getInputProps("deliveryInstructions")}
              />
            </Grid.Col>

            <Grid.Col span={12}>
              <Textarea
                label="Access Instructions"
                placeholder="Instructions for accessing this location"
                autosize
                minRows={2}
                {...form.getInputProps("accessInstructions")}
              />
            </Grid.Col>

            <Grid.Col span={12}>
              <Textarea
                label="Notes"
                placeholder="Additional notes about this address"
                autosize
                minRows={3}
                {...form.getInputProps("notes")}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Checkbox
                label="Address Verified"
                {...form.getInputProps("verified", { type: "checkbox" })}
              />
            </Grid.Col>
          </>
        )}

        {/* Form Actions */}
        <Grid.Col span={12}>
          <Group justify="flex-end" mt="lg">
            <Button
              onClick={onCancel}
              variant="outline"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              {submitText}
            </Button>
          </Group>
        </Grid.Col>
      </Grid>
    </Box>
  );
};
