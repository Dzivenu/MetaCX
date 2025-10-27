"use client";

import React, { useState, useEffect } from "react";
import { Stack, Title, Textarea, Button, Text } from "@mantine/core";
import { useOrgSettings } from "@/client/hooks/useOrgSettings";

export function OrderHeaderSettings() {
  const { settings, updateSettings, isLoading } = useOrgSettings();
  const [headerHtml, setHeaderHtml] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings?.thermalReceiptOrderHeaderHtml !== undefined) {
      setHeaderHtml(settings.thermalReceiptOrderHeaderHtml);
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    await updateSettings({
      thermalReceiptOrderHeaderHtml: headerHtml,
    });
    setSaving(false);
  };

  return (
    <Stack gap="md">
      <Title order={4}>Order Receipt Header</Title>
      <Text size="sm" c="dimmed">
        HTML content to display at the top of order receipts
      </Text>
      <Textarea
        value={headerHtml}
        onChange={(e) => setHeaderHtml(e.currentTarget.value)}
        disabled={isLoading}
        minRows={4}
        maxRows={10}
        placeholder="<p>Your header HTML here</p>"
      />
      <Button onClick={handleSave} loading={saving} disabled={isLoading} style={{ alignSelf: "flex-start" }}>
        Save
      </Button>
    </Stack>
  );
}
