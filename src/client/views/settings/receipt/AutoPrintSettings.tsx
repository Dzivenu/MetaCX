"use client";

import React, { useState, useEffect } from "react";
import { Stack, Title, Switch, Button, Text } from "@mantine/core";
import { useOrgSettings } from "@/client/hooks/useOrgSettings";

export function AutoPrintSettings() {
  const { settings, updateSettings, isLoading } = useOrgSettings();
  const [autoPrint, setAutoPrint] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings?.orderUsbReceiptAutoPrintOnOrderComplete !== undefined) {
      setAutoPrint(settings.orderUsbReceiptAutoPrintOnOrderComplete);
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    await updateSettings({
      orderUsbReceiptAutoPrintOnOrderComplete: autoPrint,
    });
    setSaving(false);
  };

  return (
    <Stack gap="md">
      <Title order={4}>Auto Print Settings</Title>
      <Text size="sm" c="dimmed">
        Automatically print receipts when orders are completed
      </Text>
      <Switch
        label="Auto-print receipts on order completion"
        checked={autoPrint}
        onChange={(e) => setAutoPrint(e.currentTarget.checked)}
        disabled={isLoading}
      />
      <Button onClick={handleSave} loading={saving} disabled={isLoading} style={{ alignSelf: "flex-start" }}>
        Save
      </Button>
    </Stack>
  );
}
