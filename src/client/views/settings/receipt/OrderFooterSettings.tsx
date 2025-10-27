"use client";

import React, { useState, useEffect } from "react";
import { Stack, Title, Textarea, Button, Text } from "@mantine/core";
import { useOrgSettings } from "@/client/hooks/useOrgSettings";

export function OrderFooterSettings() {
  const { settings, updateSettings, isLoading } = useOrgSettings();
  const [footerHtml, setFooterHtml] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings?.thermalReceiptOrderFooterHtml !== undefined) {
      setFooterHtml(settings.thermalReceiptOrderFooterHtml);
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    await updateSettings({
      thermalReceiptOrderFooterHtml: footerHtml,
    });
    setSaving(false);
  };

  return (
    <Stack gap="md">
      <Title order={4}>Order Receipt Footer</Title>
      <Text size="sm" c="dimmed">
        HTML content to display at the bottom of order receipts
      </Text>
      <Textarea
        value={footerHtml}
        onChange={(e) => setFooterHtml(e.currentTarget.value)}
        disabled={isLoading}
        minRows={4}
        maxRows={10}
        placeholder="<p>Your footer HTML here</p>"
      />
      <Button onClick={handleSave} loading={saving} disabled={isLoading} style={{ alignSelf: "flex-start" }}>
        Save
      </Button>
    </Stack>
  );
}
