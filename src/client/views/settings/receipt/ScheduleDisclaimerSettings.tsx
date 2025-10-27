"use client";

import React, { useState, useEffect } from "react";
import { Stack, Title, Textarea, Button, Text } from "@mantine/core";
import { useOrgSettings } from "@/client/hooks/useOrgSettings";

export function ScheduleDisclaimerSettings() {
  const { settings, updateSettings, isLoading } = useOrgSettings();
  const [disclaimerHtml, setDisclaimerHtml] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings?.thermalReceiptScheduledOrderDisclaimerHtml !== undefined) {
      setDisclaimerHtml(settings.thermalReceiptScheduledOrderDisclaimerHtml);
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    await updateSettings({
      thermalReceiptScheduledOrderDisclaimerHtml: disclaimerHtml,
    });
    setSaving(false);
  };

  return (
    <Stack gap="md">
      <Title order={4}>Scheduled Order Disclaimer</Title>
      <Text size="sm" c="dimmed">
        Additional disclaimer text for scheduled crypto transactions
      </Text>
      <Textarea
        value={disclaimerHtml}
        onChange={(e) => setDisclaimerHtml(e.currentTarget.value)}
        disabled={isLoading}
        minRows={4}
        maxRows={10}
        placeholder="<p>Your disclaimer HTML here</p>"
      />
      <Button onClick={handleSave} loading={saving} disabled={isLoading} style={{ alignSelf: "flex-start" }}>
        Save
      </Button>
    </Stack>
  );
}
