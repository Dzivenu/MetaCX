"use client";

import React, { useState, useEffect } from "react";
import { Stack, Title, Group, NumberInput, Button } from "@mantine/core";
import { useOrgSettings } from "@/client/hooks/useOrgSettings";

export function PaddingSettings() {
  const { settings, updateSettings, isLoading } = useOrgSettings();
  const [leftPadding, setLeftPadding] = useState(5);
  const [rightPadding, setRightPadding] = useState(5);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings?.thermalReceiptLeftPaddingPixels !== undefined) {
      setLeftPadding(settings.thermalReceiptLeftPaddingPixels);
    }
    if (settings?.thermalReceiptRightPaddingPixels !== undefined) {
      setRightPadding(settings.thermalReceiptRightPaddingPixels);
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    await updateSettings({
      thermalReceiptLeftPaddingPixels: leftPadding,
      thermalReceiptRightPaddingPixels: rightPadding,
    });
    setSaving(false);
  };

  return (
    <Stack gap="md">
      <Title order={4}>Receipt Padding</Title>
      <Group align="flex-end">
        <NumberInput
          label="Left Padding (px)"
          value={leftPadding}
          onChange={(value) => setLeftPadding(Number(value) || 0)}
          disabled={isLoading}
          min={0}
          max={50}
        />
        <NumberInput
          label="Right Padding (px)"
          value={rightPadding}
          onChange={(value) => setRightPadding(Number(value) || 0)}
          disabled={isLoading}
          min={0}
          max={50}
        />
        <Button onClick={handleSave} loading={saving} disabled={isLoading}>
          Save
        </Button>
      </Group>
    </Stack>
  );
}
