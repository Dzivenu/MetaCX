"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Stack,
  Group,
  Text,
  Button,
  Badge,
  Table,
  Modal,
  Pagination,
  Select,
  ActionIcon,
  Loader,
  Alert,
  Menu,
  Divider,
  Box,
  Tooltip,
} from "@mantine/core";
import {
  IconPlus,
  IconDots,
  IconEdit,
  IconTrash,
  IconEye,
  IconCircleX,
} from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  useCxSessions,
  useCreateCxSession,
  useCxSessionMutations,
  CreateCxSessionData,
  CxSessionFilters,
} from "@/client/hooks/useCxSessionsConvex";
import { useActiveSessionContext } from "@/client/providers/ActiveSessionProvider";
import { useActiveOrganization } from "@/client/hooks/useActiveOrganization";
import { useActiveSession } from "@/client/hooks/useActiveSession";

export function PortalSessionManager() {
  const { activeOrganization } = useActiveOrganization();
  const { activeSession } = useActiveSession();
  const { refreshActiveSession, clearActiveSession } = useActiveSessionContext();
  const {
    joinSession,
    leaveSession,
    deleteSession,
    isLoading: isMutationLoading,
  } = useCxSessionMutations();
  const [
    createModalOpened,
    { open: openCreateModal, close: closeCreateModal },
  ] = useDisclosure(false);
  const [viewModalOpened, { open: openViewModal, close: closeViewModal }] =
    useDisclosure(false);
  const [editModalOpened, { open: openEditModal, close: closeEditModal }] =
    useDisclosure(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);

  // List sessions with pagination and filtering
  const {
    sessions,
    pagination,
    filters,
    isLoading: isLoadingSessions,
    error: sessionsError,
    updateFilters,
    refresh,
  } = useCxSessions({
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
    organizationId: activeOrganization?.id || undefined,
  });

  // Create session
  const {
    createSession,
    isLoading: isCreating,
    error: createError,
  } = useCreateCxSession();

  // Handle session creation
  const handleCreateSession = async () => {
    if (!activeOrganization?.id) {
      console.error("No active organization found");
      return;
    }

    try {
      const sessionData: CreateCxSessionData = {
        organizationId: activeOrganization.id,
      };

      await createSession(sessionData);
      await refreshActiveSession();
      closeCreateModal();
      refresh();
    } catch (error) {
      console.error("Failed to create session:", error);
    }
  };

  // Handle filter changes
  const handleFilterChange = useCallback(
    (newFilters: Partial<CxSessionFilters>) => {
      updateFilters({ ...filters, ...newFilters });
    },
    [filters, updateFilters]
  );

  // Update filter change handlers to use handleFilterChange
  const handleStatusChange = useCallback(
    (value: string | null) => {
      handleFilterChange({ status: value || undefined, page: 1 });
    },
    [handleFilterChange]
  );

  const handleSortByChange = useCallback(
    (
      value: "createdAt" | "updatedAt" | "openStartDt" | "closeStartDt" | null
    ) => {
      handleFilterChange({ sortBy: value || undefined, page: 1 });
    },
    [handleFilterChange]
  );

  const handleSortOrderChange = useCallback(
    (value: "asc" | "desc" | null) => {
      handleFilterChange({ sortOrder: value || undefined, page: 1 });
    },
    [handleFilterChange]
  );

  // Handle joining a session
  const handleJoinSession = useCallback(
    async (sessionId: string) => {
      try {
        await joinSession(sessionId);
        refreshActiveSession();
        refresh();
      } catch (error) {
        console.error("Failed to join session:", error);
      }
    },
    [joinSession, refreshActiveSession, refresh]
  );

  // Handle leaving a session
  const handleLeaveSession = useCallback(
    async (sessionId: string) => {
      try {
        await leaveSession(sessionId);
        // Refresh the active session context
        refreshActiveSession();
        // Refresh the sessions list to update UI
        refresh();
      } catch (error) {
        console.error("Failed to leave session:", error);
      }
    },
    [leaveSession, refreshActiveSession, refresh]
  );

  // Handle closing a session
  const handleCloseSession = useCallback(
    async (sessionId: string) => {
      try {
        await clearActiveSession();
        notifications.show({
          title: "Success",
          message: "Session closed successfully",
          color: "green",
        });
        refresh();
        refreshActiveSession();
      } catch (error) {
        console.error("Failed to close session:", error);
        notifications.show({
          title: "Error",
          message: "Failed to close session",
          color: "red",
        });
      }
    },
    [clearActiveSession, refresh, refreshActiveSession]
  );

  const [
    deleteModalOpened,
    { open: openDeleteModal, close: closeDeleteModal },
  ] = useDisclosure(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  const handleDeleteSession = (sessionId: string) => {
    setSessionToDelete(sessionId);
    openDeleteModal();
  };

  const confirmDeleteSession = async () => {
    if (!sessionToDelete) return;

    try {
      await deleteSession(sessionToDelete);
      notifications.show({
        title: "Success",
        message: "Session deleted successfully",
        color: "green",
      });
      refresh();
      closeDeleteModal();
      setSessionToDelete(null);
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to delete session",
        color: "red",
      });
    }
  };

  const handleViewSession = (session: any) => {
    setSelectedSession(session);
    openViewModal();
  };

  const handleEditSession = (session: any) => {
    setSelectedSession(session);
    openEditModal();
  };

  // Format date helper function
  const formatDate = useCallback(
    (date: string | Date | null | undefined): string => {
      if (!date) return "N/A";
      return new Date(date).toLocaleDateString();
    },
    []
  );

  const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case "dormant":
        return "blue";
      case "open":
        return "green";
      case "active":
        return "green";
      case "pending":
      case "pending_open":
      case "pending_close":
        return "yellow";
      case "closed":
        return "gray";
      case "cancelled":
        return "red";
      default:
        return "blue";
    }
  };

  // Loading state for active organization
  const [isOrgInitializing, setIsOrgInitializing] = useState(true);

  // Sync with active organization provider to ensure consistency
  const { activeOrganization: contextOrg } = useActiveOrganization();

  // Effect to ensure active organization is loaded
  useEffect(() => {
    if (!activeOrganization && contextOrg) {
      // If we don't have the organization but context does, use it
      // setActiveOrganization(contextOrg);
    }
    // Organization data is either loaded or confirmed missing
    setIsOrgInitializing(false);
  }, [activeOrganization, contextOrg]);

  // Show loading during organization initialization
  if (isOrgInitializing) {
    return (
      <Card withBorder p="xl">
        <Group justify="center" p="xl">
          <Loader size="sm" />
          <Text>Loading organization data...</Text>
        </Group>
      </Card>
    );
  }

  // Show alert if no organization is selected
  if (!activeOrganization) {
    return (
      <Alert color="yellow" title="No Active Organization">
        Please select an organization to manage sessions.
      </Alert>
    );
  }

  return (
    <Stack gap="lg">
      {/* Header */}
      <Group justify="space-between">
        <div>
          <Text size="lg" fw={600}>
            Sessions for {activeOrganization.name}
          </Text>
          <Text size="sm" c="dimmed">
            Manage customer exchange sessions
          </Text>
        </div>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={openCreateModal}
          loading={isCreating}
        >
          Create Session
        </Button>
      </Group>

      {/* Filters */}
      <Card withBorder>
        <Group gap="md">
          <Select
            placeholder="Filter by status"
            value={filters.status || ""}
            onChange={(value) => handleStatusChange(value)}
            data={[
              { value: "", label: "All statuses" },
              { value: "DORMANT", label: "Dormant" },
              { value: "open", label: "Open" },
              { value: "pending_open", label: "Pending Open" },
              { value: "pending_close", label: "Pending Close" },
              { value: "closed", label: "Closed" },
              { value: "cancelled", label: "Cancelled" },
            ]}
            clearable
            style={{ minWidth: 150 }}
          />
          <Select
            placeholder="Sort by"
            value={filters.sortBy || "createdAt"}
            onChange={(value) =>
              handleSortByChange(
                value as
                  | "createdAt"
                  | "updatedAt"
                  | "openStartDt"
                  | "closeStartDt"
                  | null
              )
            }
            data={[
              { value: "createdAt", label: "Created Date" },
              { value: "updatedAt", label: "Updated Date" },
              { value: "openStartDt", label: "Open Start Date" },
              { value: "closeStartDt", label: "Close Start Date" },
            ]}
            style={{ minWidth: 150 }}
          />
          <Select
            placeholder="Order"
            value={filters.sortOrder || "desc"}
            onChange={(value) =>
              handleSortOrderChange(value as "asc" | "desc" | null)
            }
            data={[
              { value: "desc", label: "Newest First" },
              { value: "asc", label: "Oldest First" },
            ]}
            style={{ minWidth: 120 }}
          />
        </Group>
      </Card>

      {/* Error Display */}
      {sessionsError && (
        <Alert color="red" title="Error">
          {sessionsError}
        </Alert>
      )}

      {/* Sessions Table */}
      <Card withBorder>
        {isLoadingSessions ? (
          <Group justify="center" p="xl">
            <Loader />
          </Group>
        ) : sessions.length === 0 ? (
          <Box p="xl" ta="center">
            <Text c="dimmed">No sessions found</Text>
            <Button
              variant="light"
              leftSection={<IconPlus size={16} />}
              onClick={openCreateModal}
              mt="md"
            >
              Create your first session
            </Button>
          </Box>
        ) : (
          <Table.ScrollContainer minWidth={800}>
            <Table verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>ID</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Created</Table.Th>
                  <Table.Th>Organization ID</Table.Th>
                  <Table.Th>Open Start</Table.Th>
                  <Table.Th>Close Start</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {sessions.map((session) => (
                  <Table.Tr key={session.id}>
                    <Table.Td>
                      <Text size="sm" ff="monospace">
                        {session.id.substring(0, 8)}...
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={getStatusColor(session.status || null)}
                        variant="light"
                      >
                        {session.status || "Unknown"}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{formatDate(session.createdAt)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {session.organizationId
                          ? session.organizationId.toString()
                          : "N/A"}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {session.openStartDt
                          ? formatDate(session.openStartDt)
                          : "N/A"}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {session.closeStartDt
                          ? formatDate(session.closeStartDt)
                          : "N/A"}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs" justify="flex-end">
                        {session.status?.toLowerCase() !== "closed" &&
                          session.status?.toLowerCase() !== "cancelled" &&
                          (activeSession &&
                          (activeSession as any).id === session.id ? (
                            <Tooltip label="Leave Session">
                              <Button
                                variant="outline"
                                size="xs"
                                color="red"
                                onClick={() => handleLeaveSession(session.id)}
                                loading={isMutationLoading}
                              >
                                Leave
                              </Button>
                            </Tooltip>
                          ) : (
                            <Tooltip label="Join Session">
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() => handleJoinSession(session.id)}
                                loading={isMutationLoading}
                              >
                                Join
                              </Button>
                            </Tooltip>
                          ))}
                        <Menu shadow="md" width={200} position="bottom-end">
                          <Menu.Target>
                            <ActionIcon variant="subtle" color="gray">
                              <IconDots size={16} />
                            </ActionIcon>
                          </Menu.Target>

                          <Menu.Dropdown>
                            <Menu.Item
                              leftSection={<IconEye size={16} />}
                              onClick={() => handleViewSession(session)}
                            >
                              View Details
                            </Menu.Item>
                            <Menu.Item
                              leftSection={<IconEdit size={16} />}
                              onClick={() => handleEditSession(session)}
                            >
                              Edit
                            </Menu.Item>
                            {session.status?.toLowerCase() !== "closed" &&
                              session.status?.toLowerCase() !== "cancelled" && (
                                <Menu.Item
                                  leftSection={<IconCircleX size={16} />}
                                  color="orange"
                                  onClick={() => handleCloseSession(session.id)}
                                >
                                  Close Session
                                </Menu.Item>
                              )}
                            <Divider />
                            <Menu.Item
                              leftSection={<IconTrash size={16} />}
                              color="red"
                              onClick={() => handleDeleteSession(session.id)}
                            >
                              Delete
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <Box>
            <Divider my="md" />
            <Group justify="space-between" align="center">
              <Text size="sm" c="dimmed">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                of {pagination.total} sessions
              </Text>
              <Pagination
                total={pagination.totalPages}
                value={pagination.page}
                onChange={(page) => updateFilters({ page })}
                siblings={1}
                boundaries={1}
                size="sm"
                mt="md"
              />
            </Group>
            {pagination.totalPages > 1 && (
              <Text size="sm" c="dimmed" mt="xs">
                Page {pagination.page} of {pagination.totalPages}
              </Text>
            )}
          </Box>
        )}
      </Card>

      {/* Create Session Modal */}
      <Modal
        opened={createModalOpened}
        onClose={closeCreateModal}
        title="Create New Session"
        size="md"
        centered
        withCloseButton
        closeOnClickOutside
        closeOnEscape
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            A new session will be created for{" "}
            <strong>{activeOrganization.name}</strong>. The user ID and status
            will be automatically set by the system.
          </Text>

          {createError && (
            <Alert color="red" mt="md">
              {createError}
            </Alert>
          )}

          <Group justify="flex-end" gap="sm">
            <Button variant="subtle" onClick={closeCreateModal}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateSession}
              loading={isCreating}
              leftSection={<IconPlus size={16} />}
            >
              Create Session
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* View Session Details Modal */}
      <Modal
        opened={viewModalOpened}
        onClose={closeViewModal}
        title="Session Details"
        size="lg"
        centered
        withCloseButton
        closeOnClickOutside
        closeOnEscape
      >
        {selectedSession && (
          <Stack gap="md">
            <div>
              <Text fw={600}>Session ID</Text>
              <Text size="sm" ff="monospace">
                {selectedSession.id}
              </Text>
            </div>
            <div>
              <Text fw={600}>Status</Text>
              <Badge
                color={getStatusColor(selectedSession.status || null)}
                variant="light"
              >
                {selectedSession.status || "Unknown"}
              </Badge>
            </div>
            <div>
              <Text fw={600}>Created</Text>
              <Text size="sm">{formatDate(selectedSession.createdAt)}</Text>
            </div>
            <div>
              <Text fw={600}>Organization ID</Text>
              <Text size="sm">{selectedSession.organizationId || "N/A"}</Text>
            </div>
            <div>
              <Text fw={600}>Open Start Date</Text>
              <Text size="sm">{formatDate(selectedSession.openStartDt)}</Text>
            </div>
            <div>
              <Text fw={600}>Close Start Date</Text>
              <Text size="sm">{formatDate(selectedSession.closeStartDt)}</Text>
            </div>
            <Group justify="flex-end">
              <Button variant="outline" onClick={closeViewModal}>
                Close
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Edit Session Modal */}
      <Modal
        opened={editModalOpened}
        onClose={closeEditModal}
        title="Edit Session"
        size="md"
        centered
        withCloseButton
        closeOnClickOutside
        closeOnEscape
      >
        {selectedSession && (
          <Stack gap="md">
            <div>
              <Text fw={600}>Session ID</Text>
              <Text size="sm" ff="monospace">
                {selectedSession.id}
              </Text>
            </div>
            <div>
              <Text fw={600}>Status</Text>
              <Select
                value={selectedSession.status || ""}
                onChange={() => {
                  // This would need to be connected to an update API
                }}
                data={[
                  { value: "DORMANT", label: "Dormant" },
                  { value: "open", label: "Open" },
                  { value: "pending_open", label: "Pending Open" },
                  { value: "pending_close", label: "Pending Close" },
                  { value: "closed", label: "Closed" },
                  { value: "cancelled", label: "Cancelled" },
                ]}
              />
            </div>
            <Group justify="flex-end">
              <Button variant="outline" onClick={closeEditModal}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  // This would need to be connected to an update API
                  notifications.show({
                    title: "Info",
                    message: "Session editing functionality to be implemented",
                    color: "blue",
                  });
                  closeEditModal();
                }}
              >
                Save Changes
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        title="Delete Session"
        size="md"
        centered
        withCloseButton
        closeOnClickOutside
        closeOnEscape
      >
        <Stack gap="md">
          <Text size="sm">
            Are you sure you want to delete this session? This action cannot be
            undone.
          </Text>
          <Group justify="flex-end">
            <Button variant="outline" onClick={closeDeleteModal}>
              Cancel
            </Button>
            <Button color="red" onClick={confirmDeleteSession}>
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
