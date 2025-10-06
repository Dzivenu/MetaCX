"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Button,
  Grid,
  Group,
  Select,
  TextInput,
  Checkbox,
  Alert,
  Text,
  Divider,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import type {
  CreateIdentificationData,
  OrgIdentification,
} from "@/client/hooks/useOrgIdentifications";

const ID_TYPES = [
  "PASSPORT",
  "DRIVING_LICENSE",
  "NATIONAL_ID",
  "RESIDENCY_CARD",
  "VISA",
  "OTHER",
];

const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
];

const US_STATES = [
  { code: "NY", name: "New York" },
  { code: "CA", name: "California" },
  { code: "TX", name: "Texas" },
  { code: "FL", name: "Florida" },
  { code: "WA", name: "Washington" },
];

interface Props {
  initialData?: Partial<OrgIdentification>;
  orgCustomerId: string;
  onSubmit: (data: CreateIdentificationData) => Promise<void>;
  onCancel: () => void;
  submitText?: string;
}

export const IdentificationForm: React.FC<Props> = ({
  initialData,
  orgCustomerId,
  onSubmit,
  onCancel,
  submitText = "Save",
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm({
    initialValues: {
      orgCustomerId: orgCustomerId as any,
      typeOf: initialData?.typeOf || "",
      referenceNumber: initialData?.referenceNumber || "",
      issuingCountryCode: initialData?.issuingCountryCode || "US",
      issuingCountryName: initialData?.issuingCountryName || "United States",
      issuingStateCode: initialData?.issuingStateCode || "",
      issuingStateName: initialData?.issuingStateName || "",
      issueDate: initialData?.issueDate
        ? new Date(initialData.issueDate)
        : null,
      expiryDate: initialData?.expiryDate
        ? new Date(initialData.expiryDate)
        : null,
      verified: initialData?.verified || false,
      primary: initialData?.primary || false,
      description: initialData?.description || "",
    },
    validate: {
      typeOf: (v) => (!v ? "Type is required" : null),
      referenceNumber: (v) =>
        !v?.trim() ? "Reference number is required" : null,
      issuingCountryCode: (v) => (!v ? "Issuing country is required" : null),
    },
  });

  const watchedCountry = form.values.issuingCountryCode;

  // Memoized data arrays to prevent infinite re-renders
  const idTypeOptions = useMemo(
    () =>
      ID_TYPES.map((x) => ({
        value: x,
        label: x.replace(/_/g, " "),
      })),
    []
  );

  const countryOptions = useMemo(
    () =>
      COUNTRIES.map((c) => ({
        value: c.code,
        label: `${c.name} (${c.code})`,
      })),
    []
  );

  const stateOptions = useMemo(
    () =>
      US_STATES.map((s) => ({
        value: s.code,
        label: `${s.name} (${s.code})`,
      })),
    []
  );

  useEffect(() => {
    if (watchedCountry === "US" && form.values.issuingStateCode) {
      const state = US_STATES.find(
        (s) => s.code === form.values.issuingStateCode
      );
      if (state) form.setFieldValue("issuingStateName", state.name);
    }
    const country = COUNTRIES.find((c) => c.code === watchedCountry);
    if (country) form.setFieldValue("issuingCountryName", country.name);
  }, [watchedCountry]);

  const toTimestamp = (val: any): number | undefined => {
    if (!val) return undefined;
    if (val instanceof Date) return val.getTime();
    if (typeof val === "number") return val;
    if (typeof val === "string") {
      const d = new Date(val);
      const t = d.getTime();
      return Number.isNaN(t) ? undefined : t;
    }
    return undefined;
  };

  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit({
        orgCustomerId: values.orgCustomerId,
        typeOf: values.typeOf,
        referenceNumber: values.referenceNumber,
        issuingCountryCode: values.issuingCountryCode,
        issuingCountryName: values.issuingCountryName,
        issuingStateCode: values.issuingStateCode || undefined,
        issuingStateName: values.issuingStateName || undefined,
        issueDate: toTimestamp(values.issueDate),
        expiryDate: toTimestamp(values.expiryDate),
        verified: values.verified,
        primary: values.primary,
        description: values.description || undefined,
      });
    } catch (e) {
      setSubmitError(
        e instanceof Error ? e.message : "Failed to save identification"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={form.onSubmit(handleSubmit)}>
      {submitError && (
        <Alert color="red" title="Error" mb="md">
          {submitError}
        </Alert>
      )}
      <Grid>
        <Grid.Col span={{ base: 12, sm: 6 }}>
          <Select
            label="Type"
            data={idTypeOptions}
            withAsterisk
            {...form.getInputProps("typeOf")}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6 }}>
          <TextInput
            label="Reference Number"
            placeholder="Document number"
            withAsterisk
            {...form.getInputProps("referenceNumber")}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6 }}>
          <Select
            label="Issuing Country"
            data={countryOptions}
            withAsterisk
            searchable
            {...form.getInputProps("issuingCountryCode")}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6 }}>
          {watchedCountry === "US" ? (
            <Select
              label="Issuing State"
              data={stateOptions}
              searchable
              {...form.getInputProps("issuingStateCode")}
            />
          ) : (
            <TextInput
              label="Issuing State/Province"
              {...form.getInputProps("issuingStateName")}
            />
          )}
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6 }}>
          <DateInput label="Issue Date" {...form.getInputProps("issueDate")} />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6 }}>
          <DateInput
            label="Expiry Date"
            {...form.getInputProps("expiryDate")}
          />
        </Grid.Col>

        <Grid.Col span={12}>
          <Divider my="xs" />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6 }}>
          <Checkbox
            label="Verified"
            {...form.getInputProps("verified", { type: "checkbox" })}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6 }}>
          <Checkbox
            label="Primary"
            {...form.getInputProps("primary", { type: "checkbox" })}
          />
        </Grid.Col>

        <Grid.Col span={12}>
          <TextInput
            label="Notes"
            placeholder="Optional notes"
            {...form.getInputProps("description")}
          />
        </Grid.Col>

        <Grid.Col span={12}>
          <Group justify="flex-end" mt="md">
            <Button variant="outline" onClick={onCancel} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting} disabled={submitting}>
              {submitText}
            </Button>
          </Group>
        </Grid.Col>
      </Grid>
    </Box>
  );
};
