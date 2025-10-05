"use client";

import React from "react";
import { Title, Group, Button, Text, Box, Stack, Divider } from "@mantine/core";
import { IconHistory } from "@tabler/icons-react";

export function QuoteStepHeader() {
  return (
    <Stack gap="lg">
      {/* New Order Header */}
      <Group justify="space-between" align="center">
        <Title order={2}>New Order</Title>
        <Button
          variant="outline"
          leftSection={<IconHistory size={16} />}
          size="sm"
        >
          Order History
        </Button>
      </Group>

      {/* Select a Quote Section */}
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Title order={3} c="dimmed">
            Select a Quote
          </Title>
          <Text size="sm" c="orange" fw={500}>
            Make sure to save the quote
          </Text>
        </Group>
        <Divider />
      </Stack>
    </Stack>
  );
}
