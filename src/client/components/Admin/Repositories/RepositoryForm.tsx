"use client";

import React, { useState } from "react";

import {
  Text,
  Button,
  TextInput,
  Select,
  Switch,
  Group,
  Stack,
} from "@mantine/core";

import type { Repository } from "@/client/hooks/useRepositoriesConvex";

interface RepositoryFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  repository?: Repository;
}

interface FormData {
  name: string;
  key: string;
  typeOf: string;
  currencyType: string;
  form: string;
  floatThresholdBottom?: number;
  floatThresholdTop?: number;
  floatCountRequired: boolean;
  active: boolean;
}

export function RepositoryForm({
  onSuccess,
  onCancel,
  repository,
}: RepositoryFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    name: repository?.name || "",
    key: repository?.key || "",
    typeOf: repository?.typeOf || "STANDARD",
    currencyType: repository?.currencyType || "FIAT",
    form: repository?.form || "PHYSICAL",
    floatThresholdBottom: repository?.floatThresholdBottom || 0,
    floatThresholdTop: repository?.floatThresholdTop || 10000,
    floatCountRequired: repository?.floatCountRequired ?? true,
    active: repository?.active ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/repositories", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create repository");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    field: keyof FormData,
    value: string | number | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div style={{ padding: "lg" }}>
      <Stack>
        <div>
          <Text fw={500} size="lg">
            Create New Repository
          </Text>
          <Text size="sm" c="dimmed">
            Set up a new repository for managing your organization&apos;s
            assets.
          </Text>
        </div>
        <form onSubmit={handleSubmit}>
          <Stack>
            {error && (
              <div style={{ padding: "md", backgroundColor: "#fef2f2" }}>
                <Text size="sm" color="red">
                  {error}
                </Text>
              </div>
            )}

            <TextInput
              label="Repository Name *"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.currentTarget.value)}
              placeholder="e.g., Main Repository"
              required
            />

            <TextInput
              label="Repository Key *"
              value={formData.key}
              onChange={(e) => handleInputChange("key", e.currentTarget.value)}
              placeholder="e.g., MAIN"
              required
            />

            <Group grow>
              <Select
                label="Type"
                value={formData.typeOf}
                onChange={(value) => handleInputChange("typeOf", value || "")}
                data={[
                  { value: "STANDARD", label: "Standard" },
                  { value: "VAULT", label: "Vault" },
                  { value: "FLOAT", label: "Float" },
                ]}
              />

              <Select
                label="Currency Type"
                value={formData.currencyType}
                onChange={(value) =>
                  handleInputChange("currencyType", value || "")
                }
                data={[
                  { value: "FIAT", label: "Fiat" },
                  { value: "CRYPTO", label: "Cryptocurrency" },
                ]}
              />
            </Group>

            <Select
              label="Form"
              value={formData.form}
              onChange={(value) => handleInputChange("form", value || "")}
              data={[
                { value: "PHYSICAL", label: "Physical" },
                { value: "DIGITAL", label: "Digital" },
                { value: "VIRTUAL", label: "Virtual" },
              ]}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Group grow>
                <TextInput
                  label="Float Threshold Bottom"
                  type="number"
                  value={formData.floatThresholdBottom}
                  onChange={(e) =>
                    handleInputChange(
                      "floatThresholdBottom",
                      parseFloat(e.currentTarget.value) || 0
                    )
                  }
                  placeholder="0.00"
                  step="0.01"
                />

                <TextInput
                  label="Float Threshold Top"
                  type="number"
                  value={formData.floatThresholdTop}
                  onChange={(e) =>
                    handleInputChange(
                      "floatThresholdTop",
                      parseFloat(e.currentTarget.value) || 0
                    )
                  }
                  placeholder="0.00"
                  step="0.01"
                />
              </Group>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Text size="sm">Require Float Count</Text>
                <Switch
                  checked={formData.floatCountRequired}
                  onChange={(e) =>
                    handleInputChange(
                      "floatCountRequired",
                      e.currentTarget.checked
                    )
                  }
                />
              </div>

              <Switch
                label="Active"
                checked={formData.active}
                onChange={(e) =>
                  handleInputChange("active", e.currentTarget.checked)
                }
              />
            </div>

            <Group>
              <Button type="submit" loading={loading} fullWidth>
                Create Repository
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                fullWidth
              >
                Cancel
              </Button>
            </Group>
          </Stack>
        </form>
      </Stack>
    </div>
  );
}
