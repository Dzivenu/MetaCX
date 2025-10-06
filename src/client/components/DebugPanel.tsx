"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Stack,
  Text,
  Code,
  ScrollArea,
  Group,
  Badge,
  Divider,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import { IconBug, IconTrash, IconDownload } from "@tabler/icons-react";
import { logger } from "@/client/utils/logger";

export function DebugPanel() {
  const [opened, setOpened] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (!opened || !autoRefresh) return;

    const interval = setInterval(() => {
      setLogs(logger.getRecentLogs(100));
    }, 1000);

    return () => clearInterval(interval);
  }, [opened, autoRefresh]);

  useEffect(() => {
    if (opened) {
      setLogs(logger.getRecentLogs(100));
    }
  }, [opened]);

  const clearLogs = () => {
    logger.clear();
    setLogs([]);
  };

  const exportLogs = () => {
    const dataStr = logger.exportLogs();
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `debug-logs-${new Date().toISOString()}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "error":
        return "red";
      case "warn":
        return "yellow";
      case "info":
        return "blue";
      case "debug":
        return "gray";
      default:
        return "gray";
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <>
      <Tooltip label="Debug Panel">
        <ActionIcon
          onClick={() => setOpened(true)}
          style={{
            position: "fixed",
            bottom: 20,
            right: 20,
            zIndex: 1000,
          }}
          size="lg"
          variant="filled"
          color="orange"
        >
          <IconBug size={20} />
        </ActionIcon>
      </Tooltip>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="Debug Panel"
        size="xl"
        scrollAreaComponent={ScrollArea.Autosize}
      >
        <Stack gap="md">
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Showing {logs.length} recent logs
            </Text>
            <Group gap="xs">
              <Button
                size="xs"
                variant={autoRefresh ? "filled" : "outline"}
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
              </Button>
              <Button
                size="xs"
                variant="outline"
                onClick={() => setLogs(logger.getRecentLogs(100))}
              >
                Refresh
              </Button>
              <ActionIcon
                size="sm"
                variant="outline"
                onClick={clearLogs}
                color="red"
              >
                <IconTrash size={14} />
              </ActionIcon>
              <ActionIcon
                size="sm"
                variant="outline"
                onClick={exportLogs}
                color="blue"
              >
                <IconDownload size={14} />
              </ActionIcon>
            </Group>
          </Group>

          <Divider />

          <ScrollArea h={400}>
            <Stack gap="xs">
              {logs.length === 0 ? (
                <Text c="dimmed" ta="center" py="xl">
                  No logs available
                </Text>
              ) : (
                logs.reverse().map((log, index) => (
                  <div key={index} style={{ fontSize: "12px" }}>
                    <Group gap="xs" mb={4}>
                      <Badge size="xs" color={getLevelColor(log.level)}>
                        {log.level.toUpperCase()}
                      </Badge>
                      <Text size="xs" c="dimmed">
                        {formatTimestamp(log.timestamp)}
                      </Text>
                      {log.component && (
                        <Badge size="xs" variant="outline">
                          {log.component}
                        </Badge>
                      )}
                      {log.action && (
                        <Badge size="xs" variant="dot">
                          {log.action}
                        </Badge>
                      )}
                    </Group>

                    <Text size="sm" mb={4}>
                      {log.message}
                    </Text>

                    {(log.props || log.state || log.error) && (
                      <Code block style={{ fontSize: "10px" }}>
                        {JSON.stringify(
                          {
                            ...(log.props && { props: log.props }),
                            ...(log.state && { state: log.state }),
                            ...(log.error && { error: log.error }),
                          },
                          null,
                          2
                        )}
                      </Code>
                    )}

                    <Divider size="xs" my="xs" />
                  </div>
                ))
              )}
            </Stack>
          </ScrollArea>
        </Stack>
      </Modal>
    </>
  );
}
