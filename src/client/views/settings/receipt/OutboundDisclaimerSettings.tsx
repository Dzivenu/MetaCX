"use client";

import React, { useState, useEffect } from "react";
import { Stack, Title, Textarea, Button, Text, List } from "@mantine/core";
import { useOrgSettings } from "@/client/hooks/useOrgSettings";

export function OutboundDisclaimerSettings() {
  const { settings, updateSettings, isLoading } = useOrgSettings();
  const [disclaimerHtml, setDisclaimerHtml] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings?.thermalReceiptOutboundCryptoOrderDisclaimerHtml !== undefined) {
      setDisclaimerHtml(settings.thermalReceiptOutboundCryptoOrderDisclaimerHtml);
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    await updateSettings({
      thermalReceiptOutboundCryptoOrderDisclaimerHtml: disclaimerHtml,
    });
    setSaving(false);
  };

  return (
    <Stack gap="md">
      <Title order={4}>Outbound Crypto Receipt Disclaimer</Title>
      <Text size="sm" c="dimmed">
        Disclaimer text for outbound crypto transactions
      </Text>
      <Text size="sm" c="dimmed">
        Placeholders:
        <List size="sm">
          <List.Item>__WALLET__ - displays the outbound (customer) crypto address</List.Item>
          <List.Item>__CUSTOMER_NAME__ - displays the customer name</List.Item>
        </List>
      </Text>
      <Textarea
        value={disclaimerHtml}
        onChange={(e) => setDisclaimerHtml(e.currentTarget.value)}
        disabled={isLoading}
        minRows={6}
        maxRows={12}
        placeholder="<p>Your disclaimer HTML here</p>"
      />
      <Button onClick={handleSave} loading={saving} disabled={isLoading} style={{ alignSelf: "flex-start" }}>
        Save
      </Button>
    </Stack>
  );
}
