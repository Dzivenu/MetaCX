"use client";

import React, { useState, useEffect } from "react";
import { Stack, Title, Group, Select, Button } from "@mantine/core";
import { useOrgSettings } from "@/client/hooks/useOrgSettings";

const fontSizeOptions = [8, 10, 12, 14, 16, 18, 20].map((size) => ({
  value: String(size),
  label: `${size}px`,
}));

export function FontSizeSettings() {
  const { settings, updateSettings, isLoading } = useOrgSettings();
  const [fontSize, setFontSize] = useState("12");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings?.thermalReceiptFontSizePixels) {
      setFontSize(String(settings.thermalReceiptFontSizePixels));
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    await updateSettings({
      thermalReceiptFontSizePixels: parseInt(fontSize),
    });
    setSaving(false);
  };

  return (
    <Stack gap="md">
      <Title order={4}>Receipt Font Size</Title>
      <Group align="flex-end">
        <Select
          label="Font Size"
          data={fontSizeOptions}
          value={fontSize}
          onChange={(value) => setFontSize(value || "12")}
          disabled={isLoading}
          style={{ flex: 1 }}
        />
        <Button onClick={handleSave} loading={saving} disabled={isLoading}>
          Save
        </Button>
      </Group>
    </Stack>
  );
}
