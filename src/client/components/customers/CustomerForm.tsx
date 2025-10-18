"use client";

import { useState } from "react";
import { useForm } from "@mantine/form";
import { Button, Grid, Group, TextInput, Text, Stack } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import dayjs from "dayjs";

interface CustomerFormProps {
  onSubmit: (values: CustomerFormValues) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  showCancel?: boolean;
}

export interface CustomerFormValues {
  firstName: string;
  lastName: string;
  title: string;
  middleName: string;
  dob: Date | null;
  occupation: string;
  employer: string;
  telephone: string;
  email: string;
}

export function CustomerForm({
  onSubmit,
  onCancel,
  submitLabel = "Create Customer",
  showCancel = true,
}: CustomerFormProps) {
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

  const handleSubmit = form.onSubmit(async (values) => {
    setSubmitting(true);
    setError(null);

    try {
      await onSubmit(values);
      form.reset();
    } catch (err) {
      console.error("Error submitting customer form:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to submit form";
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Stack gap="md">
      {error && (
        <Text c="red" size="sm">
          {error}
        </Text>
      )}
      <form onSubmit={handleSubmit}>
        <Grid gutter="md">
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label="First Name"
              required
              disabled={submitting}
              {...form.getInputProps("firstName")}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label="Last Name"
              required
              disabled={submitting}
              {...form.getInputProps("lastName")}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label="Title"
              disabled={submitting}
              {...form.getInputProps("title")}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label="Middle Name"
              disabled={submitting}
              {...form.getInputProps("middleName")}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <DateInput
              label="Date of Birth"
              placeholder="Select date"
              required
              disabled={submitting}
              value={form.values.dob}
              onChange={(d) => form.setFieldValue("dob", d as Date | null)}
              error={form.errors.dob}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label="Occupation"
              disabled={submitting}
              {...form.getInputProps("occupation")}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label="Employer"
              disabled={submitting}
              {...form.getInputProps("employer")}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label="Telephone"
              disabled={submitting}
              {...form.getInputProps("telephone")}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              type="email"
              label="Email"
              disabled={submitting}
              {...form.getInputProps("email")}
            />
          </Grid.Col>
          <Grid.Col span={12}>
            <Group justify="flex-start" mt="sm">
              <Button type="submit" loading={submitting}>
                {submitting ? "Submitting..." : submitLabel}
              </Button>
              {showCancel && onCancel && (
                <Button variant="outline" type="button" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </Group>
          </Grid.Col>
        </Grid>
      </form>
    </Stack>
  );
}
