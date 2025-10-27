"use client";

import React, { useState } from "react";
import {
  Card,
  Title,
  Text,
  Stack,
  Group,
  Button,
  Textarea,
  TextInput,
  Badge,
  ActionIcon,
  Checkbox,
  Timeline,
} from "@mantine/core";
import {
  IconPlus,
  IconCheck,
  IconX,
  IconTrash,
  IconNote,
} from "@tabler/icons-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { useOrgOrderById } from "@/client/hooks/useOrgOrderByIdConvex";
import type { FunctionReference } from "convex/server";
import { useAuth } from "@clerk/nextjs";

interface NotesBlockProps {
  orderId: string;
}

export function NotesBlock({ orderId }: NotesBlockProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteMessage, setNewNoteMessage] = useState("");
  const [newNoteResolvable, setNewNoteResolvable] = useState(false);

  const { orgId } = useAuth();
  const { order } = useOrgOrderById(orderId);

  // Debug: Query a specific note by ID
  const debugNoteId = "ns7ds9vjrqfnkhhnpjqrv6drg97sq5k3" as Id<"org_notes">;
  const debugNote = useQuery((api.functions as any).orgNotes?.getOrgNoteById, {
    noteId: debugNoteId,
  });

  // Try using the same pattern as the debug query that works
  const notes = useQuery(
    (api.functions as any).orgNotes?.getOrgNotesByEntity,
    orgId
      ? {
          noteType: "ORDER",
          entityId: orderId,
          clerkOrganizationId: orgId,
        }
      : "skip"
  );

  // Test with the simple query
  const notesSimple = useQuery(
    (api.functions as any).orgNotes?.getOrgNotesByEntitySimple,
    orgId
      ? {
          noteType: "ORDER",
          entityId: orderId,
          clerkOrganizationId: orgId,
        }
      : "skip"
  );

  // Direct test - query for the most recently created note
  const [lastCreatedNoteId, setLastCreatedNoteId] = useState<string | null>(null);
  const lastCreatedNote = useQuery(
    (api.functions as any).orgNotes?.getOrgNoteById,
    lastCreatedNoteId ? { noteId: lastCreatedNoteId as any } : "skip"
  );

  // Basic test - get all organization notes
  const allOrgNotes = useQuery(
    (api.functions as any).orgNotes?.getAllOrgNotes,
    orgId ? { clerkOrganizationId: orgId } : "skip"
  );

  const createNoteMutation = useMutation(
    (api.functions as any).orgNotes?.createOrgNote
  );
  const resolveNoteMutation = useMutation(
    (api.functions as any).orgNotes?.resolveOrgNote
  );
  const deleteNoteMutation = useMutation(
    (api.functions as any).orgNotes?.deleteOrgNote
  );

  const handleAddNote = async () => {
    if (!newNoteMessage.trim() || !order) {
      return;
    }

    try {
      const result = await createNoteMutation({
        noteType: "ORDER",
        entityId: orderId,
        title: newNoteTitle.trim() || undefined,
        message: newNoteMessage.trim(),
        resolvable: newNoteResolvable,
        clerkOrganizationId: order.clerkOrganizationId,
      });

      // Store the last created note ID for testing
      setLastCreatedNoteId(result);

      // Reset form
      setNewNoteTitle("");
      setNewNoteMessage("");
      setNewNoteResolvable(false);
      setIsAdding(false);
    } catch (error) {
      console.error("Failed to create note:", error);
    }
  };

  const handleResolveNote = async (
    noteId: Id<"org_notes">,
    resolved: boolean
  ) => {
    try {
      await resolveNoteMutation({ noteId, resolved });
    } catch (error) {
      console.error("Failed to resolve note:", error);
    }
  };

  const handleDeleteNote = async (noteId: Id<"org_notes">) => {
    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
      await deleteNoteMutation({ noteId });
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
  };

  return (
    <Stack gap="md">
      {/* Header with Add button */}
      <Group justify="space-between" align="center">
        <Title order={3}>Order Notes</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => setIsAdding(!isAdding)}
          variant={isAdding ? "outline" : "filled"}
        >
          {isAdding ? "Cancel" : "Add Note"}
        </Button>
      </Group>

      {/* Add Note Form */}
      {isAdding && (
        <Card withBorder>
          <Stack gap="md">
            <TextInput
              label="Title (Optional)"
              placeholder="Note title"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
            />
            <Textarea
              label="Message"
              placeholder="Enter note message..."
              required
              minRows={3}
              value={newNoteMessage}
              onChange={(e) => setNewNoteMessage(e.target.value)}
            />
            <Checkbox
              label="This note requires resolution"
              checked={newNoteResolvable}
              onChange={(e) => setNewNoteResolvable(e.currentTarget.checked)}
            />
            <Group justify="flex-end">
              <Button variant="outline" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddNote} disabled={!newNoteMessage.trim()}>
                Add Note
              </Button>
            </Group>
          </Stack>
        </Card>
      )}

      {/* Notes List */}
      <Card withBorder>
        {(!notesSimple || notesSimple.length === 0) ? (
          <Text c="dimmed" size="sm">
            No notes have been added to this order yet.
          </Text>
        ) : (
          <Timeline active={notesSimple.length} bulletSize={24} lineWidth={2}>
            {notesSimple.map((note: any) => (
              <Timeline.Item
                key={note._id}
                bullet={<IconNote size={12} />}
                title={
                  <Group justify="space-between" align="center">
                    <Group gap="xs">
                      {note.title && (
                        <Text fw={600} size="sm">
                          {note.title}
                        </Text>
                      )}
                      {note.resolvable && (
                        <Badge
                          size="sm"
                          color={note.resolved ? "green" : "orange"}
                          variant="light"
                        >
                          {note.resolved ? "Resolved" : "Needs Resolution"}
                        </Badge>
                      )}
                    </Group>
                    <Group gap="xs">
                      {note.resolvable && !note.resolved && (
                        <ActionIcon
                          size="sm"
                          variant="light"
                          color="green"
                          onClick={() => handleResolveNote(note._id, true)}
                          title="Mark as resolved"
                        >
                          <IconCheck size={14} />
                        </ActionIcon>
                      )}
                      {note.resolvable && note.resolved && (
                        <ActionIcon
                          size="sm"
                          variant="light"
                          color="orange"
                          onClick={() => handleResolveNote(note._id, false)}
                          title="Mark as unresolved"
                        >
                          <IconX size={14} />
                        </ActionIcon>
                      )}
                      <ActionIcon
                        size="sm"
                        variant="light"
                        color="red"
                        onClick={() => handleDeleteNote(note._id)}
                        title="Delete note"
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Group>
                  </Group>
                }
              >
                <Text size="sm" mt="xs">
                  {note.message}
                </Text>
                <Text size="xs" c="dimmed" mt="xs">
                  {new Date(note.createdAt).toLocaleString()}
                </Text>
                {note.resolved && note.resolvedAt && (
                  <Text size="xs" c="green" mt="xs">
                    Resolved on {new Date(note.resolvedAt).toLocaleString()}
                  </Text>
                )}
              </Timeline.Item>
            ))}
          </Timeline>
        )}
      </Card>
    </Stack>
  );
}
