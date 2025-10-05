"use client";

import React from "react";
import {
  Card,
  Text,
  Checkbox,
  Group,
  Stack,
  Title,
  Alert,
} from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useRepositories } from "@/client/hooks/useRepositoriesConvex";

interface RepositorySelectionProps {
  selectedRepositories: string[];
  onRepositoryToggle: (id: string) => void;
  currencyType: string;
}

export const RepositorySelection: React.FC<RepositorySelectionProps> = ({
  selectedRepositories,
  onRepositoryToggle,
  currencyType,
}) => {
  const { repositories, loading, error } = useRepositories();

  // Filter repositories by currency type
  // Map currency types to match repository currencyType format
  const getRepositoryCurrencyType = (currencyType: string) => {
    const normalized = currencyType?.toLowerCase();
    switch (normalized) {
      case "cryptocurrency":
      case "crypto":
        return "CRYPTO";
      case "fiat":
        return "FIAT";
      case "metal":
        return "METAL";
      default:
        return currencyType?.toUpperCase();
    }
  };

  const repositoryCurrencyType = getRepositoryCurrencyType(currencyType);
  const filteredRepositories = (repositories || []).filter(
    (repo) => !repo.currencyType || repo.currencyType === repositoryCurrencyType
  );

  if (loading) {
    return <Text>Loading repositories...</Text>;
  }

  if (error) {
    return (
      <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
        {error}
      </Alert>
    );
  }

  if (filteredRepositories.length === 0) {
    return (
      <Alert
        icon={<IconAlertCircle size={16} />}
        title="No Repositories"
        color="yellow"
      >
        No repositories available for this currency type.
      </Alert>
    );
  }

  return (
    <Stack gap="md">
      <Title order={4}>Select Repositories</Title>
      <Text size="sm" c="dimmed">
        Choose which repositories this currency should be available in.
      </Text>

      <Stack>
        {filteredRepositories.map((repo) => (
          <Card key={repo.id} withBorder padding="sm" style={{ width: "100%" }}>
            <Group justify="space-between">
              <div>
                <Text fw={500}>{repo.name}</Text>
                {repo.typeOf && (
                  <Text size="sm" c="dimmed">
                    Type: {repo.typeOf}
                  </Text>
                )}
              </div>
              <Checkbox
                checked={selectedRepositories.includes(repo.id)}
                onChange={() => onRepositoryToggle(repo.id)}
                aria-label={`Select ${repo.name}`}
              />
            </Group>
          </Card>
        ))}
      </Stack>

      {selectedRepositories.length === 0 && (
        <Text c="red" size="sm">
          At least one repository must be selected.
        </Text>
      )}
    </Stack>
  );
};
