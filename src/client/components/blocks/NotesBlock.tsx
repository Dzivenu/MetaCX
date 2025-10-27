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
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "@clerk/nextjs";

export type NoteType = "ORDER" | "SESSION" | "CUSTOMER" | "REPOSITORY" | "CURRENCY";

export interface NotesBlockProps {
  noteType: NoteType;
  entityId: string;
  title?: string;
  showAddButton?: boolean;
  showResolveOption?: boolean;
  maxHeight?: number;
  compact?: boolean;
}

export interface Note {
  _id: Id<"org_notes">;
  _creationTime: number;
  noteType: NoteType;
  entityId: string;
  clerkOrganizationId: string;
  title?: string;
  message: string;
  resolvable: boolean;
  resolved: boolean;
  resolvedAt?: number;
  createdAt: number;
  updatedAt: number;
  createdBy?: string;
}

export function NotesBlock({
  noteType,
  entityId,
  title,
  showAddButton = true,
  showResolveOption = true,
  maxHeight,
  compact = false,
}: NotesBlockProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteMessage, setNewNoteMessage] = useState("");
  const [newNoteResolvable, setNewNoteResolvable] = useState(false);

  const { orgId } = useAuth();

  // Query notes for this entity
  const notes = useQuery(
    (api.functions as any).orgNotes?.getOrgNotesByEntitySimple,
    orgId
      ? {
          noteType,
          entityId,
          clerkOrganizationId: orgId,
        }
      : "skip"
  );

  // Mutations
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
    if (!newNoteMessage.trim() || !orgId) {
      return;
    }

    try {
      await createNoteMutation({
        noteType,
        entityId,
        title: newNoteTitle.trim() || undefined,
        message: newNoteMessage.trim(),
        resolvable: showResolveOption ? newNoteResolvable : false,
        clerkOrganizationId: orgId,
      });

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

  // Generate default title based on note type
  const getDefaultTitle = () => {
    switch (noteType) {
      case "ORDER":
        return "Order Notes";
      case "SESSION":
        return "Session Notes";
      case "CUSTOMER":
        return "Customer Notes";
      case "REPOSITORY":
        return "Repository Notes";
      case "CURRENCY":
        return "Currency Notes";
      default:
        return "Notes";
    }
  };

  const displayTitle = title || getDefaultTitle();

  return (
    <Stack gap="md">
      {/* Header with Add button */}
      <Group justify="space-between" align="center">
        <Title order={compact ? 4 : 3}>{displayTitle}</Title>
        {showAddButton && (
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setIsAdding(!isAdding)}
            variant={isAdding ? "outline" : "filled"}
            size={compact ? "compact-sm" : "sm"}
          >
            {isAdding ? "Cancel" : "Add Note"}
          </Button>
        )}
      </Group>

      {/* Add Note Form */}
      {isAdding && showAddButton && (
        <Card withBorder>
          <Stack gap="md">
            <TextInput
              label="Title (Optional)"
              placeholder="Note title"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              size={compact ? "sm" : "md"}
            />
            <Textarea
              label="Message"
              placeholder="Enter note message..."
              required
              minRows={compact ? 2 : 3}
              value={newNoteMessage}
              onChange={(e) => setNewNoteMessage(e.target.value)}
              size={compact ? "sm" : "md"}
            />
            {showResolveOption && (
              <Checkbox
                label="This note requires resolution"
                checked={newNoteResolvable}
                onChange={(e) => setNewNoteResolvable(e.currentTarget.checked)}
                size={compact ? "sm" : "md"}
              />
            )}
            <Group justify="flex-end">
              <Button 
                variant="outline" 
                onClick={() => setIsAdding(false)}
                size={compact ? "compact-sm" : "sm"}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddNote} 
                disabled={!newNoteMessage.trim()}
                size={compact ? "compact-sm" : "sm"}
              >
                Add Note
              </Button>
            </Group>
          </Stack>
        </Card>
      )}

      {/* Notes List */}
      <Card withBorder p={compact ? "sm" : undefined}>
        {(!notes || notes.length === 0) ? (
          <Text c="dimmed" size="sm">
            No notes have been added yet.
          </Text>
        ) : (
          <Timeline 
            active={notes.length} 
            bulletSize={compact ? 20 : 24} 
            lineWidth={compact ? 1 : 2}
          >
            {notes.map((note: any) => (
              <Timeline.Item
                key={note._id}
                bullet={<IconNote size={compact ? 10 : 12} />}
                title={
                  <Group justify="space-between" align="center">
                    <Group gap="xs" align="center">
                      {note.title && (
                        <>
                          <Text fw={600} size="sm">
                            {note.title}
                          </Text>
                          <Text size="xs" c="dimmed">
                            •
                          </Text>
                        </>
                      )}
                      <Text size="xs" c="dimmed">
                        {new Date(note.createdAt).toLocaleString()}
                      </Text>
                      {note.creatorName && (
                        <>
                          <Text size="xs" c="dimmed">
                            •
                          </Text>
                          <Text size="xs" c="dimmed">
                            by {note.creatorName}
                          </Text>
                        </>
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
                      {showResolveOption && note.resolvable && !note.resolved && (
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
                      {showResolveOption && note.resolvable && note.resolved && (
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
                {note.resolved && note.resolvedAt && (
                  <Text size="xs" c="green" mt="4px">
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
