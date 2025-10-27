"use client";

import React, { useState, useEffect } from "react";
import { Stack, Title, Group, Select, Button } from "@mantine/core";
import { useOrgSettings } from "@/client/hooks/useOrgSettings";

const fontFaceOptions = [
  { value: "monospace", label: "Monospace" },
  { value: "Arial", label: "Arial" },
  { value: "Courier New", label: "Courier New" },
  { value: "Times New Roman", label: "Times New Roman" },
];

export function FontFaceSettings() {
  const { settings, updateSettings, isLoading } = useOrgSettings();
  const [fontFace, setFontFace] = useState("monospace");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings?.thermalReceiptFontFace) {
      setFontFace(settings.thermalReceiptFontFace);
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    await updateSettings({
      thermalReceiptFontFace: fontFace,
    });
    setSaving(false);
  };

  return (
    <Stack gap="md">
      <Title order={4}>Receipt Font Face</Title>
      <Group align="flex-end">
        <Select
          label="Font Family"
          data={fontFaceOptions}
          value={fontFace}
          onChange={(value) => setFontFace(value || "monospace")}
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
