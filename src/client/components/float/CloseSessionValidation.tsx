"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  Title,
  Text,
  Stack,
  Group,
  Button,
  Alert,
  List,
  Badge,
  Loader,
} from "@mantine/core";
import { IconAlertTriangle, IconCheck, IconX } from "@tabler/icons-react";

interface BlockingItem {
  type: "order" | "repository";
  id: string;
  status?: string;
  name?: string;
}

interface CloseSessionValidationProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  sessionId: string;
  loading?: boolean;
  validateSession: (sessionId: string) => Promise<{
    canClose: boolean;
    error: string | null;
    blockingItems: BlockingItem[];
  }>;
}

export function CloseSessionValidation({
  opened,
  onClose,
  onConfirm,
  sessionId,
  loading = false,
  validateSession,
}: CloseSessionValidationProps) {
  const [validation, setValidation] = useState<{
    canClose: boolean;
    error: string | null;
    blockingItems: BlockingItem[];
  } | null>(null);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    if (opened && sessionId) {
      handleValidateSession();
    }
  }, [opened, sessionId, validateSession]);

  const handleValidateSession = async () => {
    if (!validateSession || typeof validateSession !== 'function') {
      console.error("validateSession is not a function:", validateSession);
      setValidation({
        canClose: false,
        error: "Validation function not available",
        blockingItems: [],
      });
      return;
    }

    setValidating(true);
    try {
      const result = await validateSession(sessionId);
      setValidation(result);
    } catch (error) {
      console.error("Close session validation error:", error);
      setValidation({
        canClose: false,
        error: error instanceof Error ? error.message : "Failed to validate session",
        blockingItems: [],
      });
    } finally {
      setValidating(false);
    }
  };

  const handleConfirm = () => {
    if (validation?.canClose) {
      onConfirm();
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group>
          <Title order={3}>Close Session Validation</Title>
          {validating && <Loader size="sm" />}
        </Group>
      }
      size="md"
    >
      {validating ? (
        <Stack align="center" py="xl">
          <Loader size="lg" />
          <Text>Validating session...</Text>
        </Stack>
      ) : validation ? (
        <Stack gap="md">
          {validation.canClose ? (
            <Alert
              icon={<IconCheck size={16} />}
              title="Session Ready to Close"
              color="green"
            >
              All requirements have been met. This session can be safely closed.
            </Alert>
          ) : (
            <Alert
              icon={<IconX size={16} />}
              title="Cannot Close Session"
              color="red"
            >
              {validation.error || "Session validation failed"}
            </Alert>
          )}

          {validation.blockingItems.length > 0 && (
            <div>
              <Title order={5} mb="xs">
                Blocking Items ({validation.blockingItems.length}):
              </Title>
              <List spacing="xs">
                {validation.blockingItems.map((item, index) => (
                  <List.Item key={index}>
                    <Group>
                      <Badge
                        color={item.type === "order" ? "blue" : "orange"}
                        variant="light"
                      >
                        {item.type.toUpperCase()}
                      </Badge>
                      <Text>
                        {item.type === "order"
                          ? `Order ${item.id}`
                          : item.name || `Repository ${item.id}`}
                      </Text>
                      {item.status && (
                        <Badge color="gray" variant="outline">
                          {item.status}
                        </Badge>
                      )}
                    </Group>
                  </List.Item>
                ))}
              </List>
            </div>
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              color="red"
              onClick={handleConfirm}
              disabled={!validation.canClose || loading}
              loading={loading}
            >
              Close Session
            </Button>
          </Group>
        </Stack>
      ) : (
        <Stack align="center" py="xl">
          <Text color="dimmed">Failed to load validation data</Text>
        </Stack>
      )}
    </Modal>
  );
}
