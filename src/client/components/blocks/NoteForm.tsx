"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Stack,
  Group,
  Button,
  Textarea,
  TextInput,
  Checkbox,
} from "@mantine/core";

export interface NoteFormData {
  title?: string;
  message: string;
  resolvable: boolean;
}

interface NoteFormProps {
  initialData?: NoteFormData;
  onSubmit: (data: NoteFormData) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  showResolveOption?: boolean;
  compact?: boolean;
  isSubmitting?: boolean;
}

export function NoteForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Save",
  showResolveOption = true,
  compact = false,
  isSubmitting = false,
}: NoteFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [message, setMessage] = useState(initialData?.message || "");
  const [resolvable, setResolvable] = useState(initialData?.resolvable || false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setMessage(initialData.message || "");
      setResolvable(initialData.resolvable || false);
    }
  }, [initialData]);

  const handleSubmit = async () => {
    if (!message.trim()) return;

    await onSubmit({
      title: title.trim() || undefined,
      message: message.trim(),
      resolvable,
    });
  };

  return (
    <Card withBorder>
      <Stack gap="md">
        <TextInput
          label="Title (Optional)"
          placeholder="Note title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          size={compact ? "sm" : "md"}
        />
        <Textarea
          label="Message"
          placeholder="Enter note message..."
          required
          minRows={compact ? 2 : 3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          size={compact ? "sm" : "md"}
        />
        {showResolveOption && (
          <Checkbox
            label="This note requires resolution"
            checked={resolvable}
            onChange={(e) => setResolvable(e.currentTarget.checked)}
            size={compact ? "sm" : "md"}
          />
        )}
        <Group justify="flex-end">
          <Button
            variant="outline"
            onClick={onCancel}
            size={compact ? "compact-sm" : "sm"}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!message.trim() || isSubmitting}
            loading={isSubmitting}
            size={compact ? "compact-sm" : "sm"}
          >
            {submitLabel}
          </Button>
        </Group>
      </Stack>
    </Card>
  );
}
