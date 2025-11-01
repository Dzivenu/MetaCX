"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Container,
  Title,
  Group,
  Button,
  Alert,
  Loader,
  Stack,
  Text,
  Badge,
  Modal,
} from "@mantine/core";
import { IconInfoCircle, IconAlertTriangle } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { useDisclosure } from "@mantine/hooks";

import { useFloat } from "@/client/hooks/use-float-convex";
import { useFloatCalculations } from "@/client/hooks/use-float-calculations";
import { RepositoryCard } from "@/client/components/float/RepositoryCard";
import { CloseSessionValidation } from "@/client/components/float/CloseSessionValidation";
import { useActiveSession } from "@/client/hooks/useActiveSession";
import { useActiveSessionContext } from "@/client/providers/ActiveSessionProvider";
import { useCxSessions } from "@/client/hooks/useCxSessionsConvex";

const FloatHeader: React.FC<{
  activeSession: any;
  floatData: any;
  allFloatsCountStates: any[];
  startingCloseOrOpen: boolean;
  onStartFloat: () => void;
  onConfirmFloat: () => void;
  onCloseFloat: () => void;
  onCloseSession: () => void;
  onCancelClose: () => void;
  onBypassFloat?: () => void;
  isDebugMode?: boolean;
}> = ({
  activeSession,
  floatData,
  allFloatsCountStates,
  startingCloseOrOpen,
  onStartFloat,
  onConfirmFloat,
  onCloseFloat,
  onCloseSession,
  onCancelClose,
  onBypassFloat,
  isDebugMode = false,
}) => {
  const allFloatStacksCounted = useMemo(() => {
    const uncountedStack = allFloatsCountStates.find(
      (fs) => fs.count_required && !fs.allFloatCounted
    );
    return !uncountedStack;
  }, [allFloatsCountStates]);

  return (
    <div className="mb-6">
      <Group justify="space-between" align="center" mb="lg">
        <Title order={1}>Float</Title>

        <Group>
          {/* Debug Skip Float Button */}
          {isDebugMode &&
            (activeSession?.status === "FLOAT_OPEN_START" ||
              activeSession?.status === "FLOAT_CLOSE_START") && (
              <Button
                variant="outline"
                color="orange"
                onClick={onBypassFloat}
                disabled={startingCloseOrOpen}
              >
                Skip Float
              </Button>
            )}

          {/* Start Open Button */}
          {(!activeSession?.status || activeSession?.status === "DORMANT") && (
            <Button
              onClick={onStartFloat}
              loading={startingCloseOrOpen}
              color="green"
            >
              Start Open
            </Button>
          )}

          {/* Confirm Open Button */}
          {activeSession?.status === "FLOAT_OPEN_START" && (
            <Button
              onClick={onConfirmFloat}
              disabled={!allFloatStacksCounted || startingCloseOrOpen}
              color="blue"
            >
              Confirm Open
            </Button>
          )}

          {/* Start Close Button */}
          {activeSession?.status === "FLOAT_OPEN_COMPLETE" && (
            <Button
              onClick={onCloseFloat}
              loading={startingCloseOrOpen}
              color="orange"
            >
              Start Close
            </Button>
          )}

          {/* Close Session Buttons */}
          {activeSession?.status === "FLOAT_CLOSE_START" && (
            <Group>
              <Button
                variant="outline"
                onClick={onCancelClose}
                loading={startingCloseOrOpen}
              >
                Cancel Close
              </Button>
              <Button
                color="red"
                onClick={onCloseSession}
                disabled={!allFloatStacksCounted || startingCloseOrOpen}
              >
                Close Session
              </Button>
            </Group>
          )}
        </Group>
      </Group>
    </div>
  );
};

const SessionStats: React.FC<{
  activeSession: any;
  onClose: () => void;
}> = ({ activeSession, onClose }) => {
  const handleExit = () => {
    if (activeSession?.status === "FLOAT_CLOSE_COMPLETE") {
      // In a real app, this would clear session and redirect
      window.location.reload();
    } else {
      onClose();
    }
  };

  return (
    <Modal opened={true} onClose={onClose} title="Session Statistics" size="lg">
      <Stack>
        <Text>Session ID: {activeSession?.id}</Text>
        <Text>Status: {activeSession?.status}</Text>
        <Text>User: {activeSession?.userId}</Text>

        <Group justify="flex-end" mt="md">
          <Button onClick={handleExit}>
            {activeSession?.status === "FLOAT_CLOSE_COMPLETE"
              ? "Exit"
              : "Close"}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default function FloatPage() {
  const { activeSession, loading: activeSessionLoading } = useActiveSession();
  const { refreshActiveSession } = useActiveSessionContext();
  const [confirmedReposIds, setConfirmedReposIds] = useState<string[]>([]);
  const [
    showSessionStats,
    { open: openSessionStats, close: closeSessionStats },
  ] = useDisclosure(false);
  const [
    showCloseValidation,
    { open: openCloseValidation, close: closeCloseValidation },
  ] = useDisclosure(false);
  const [startingCloseOrOpen, setStartingCloseOrOpen] = useState(false);
  const sessionHooks = useCxSessions();
  const { closeSession, validateSessionCanClose } = sessionHooks;

  // Debug logging
  console.log('Session hooks:', sessionHooks);
  console.log('validateSessionCanClose:', validateSessionCanClose);
  console.log('validateSessionCanClose type:', typeof validateSessionCanClose);

  const {
    floatData,
    repositories,
    session,
    isLoading,
    error,
    startFloat,
    confirmFloat,
    updateRepositoryFloat,
    validateRepositoryFloat,
    isStartingFloat,
    isConfirmingFloat,
    isUpdatingFloat,
    refetch,
  } = useFloat(activeSession?._id || "");

  const { areFloatStacksConfirmed, getRepositoryState, getFloatState } =
    useFloatCalculations();

  // Calculate float count states for each repository
  const allFloatsCountStates = useMemo(() => {
    if (!repositories) return [];

    return repositories.map((repo) => {
      const floatState = getFloatState(repo.state);
      let totalCurrencies = 0;
      let countedCurrencies = 0;

      if (["OPEN", "CLOSE"].includes(floatState) && repo.float) {
        totalCurrencies = repo.float.length;
        countedCurrencies = repo.float.filter((currency: any) =>
          areFloatStacksConfirmed(floatState, currency.floatStacks)
        ).length;
      }

      return {
        id: repo.id,
        countedCurrencies,
        totalCurrencies,
        allFloatCounted: countedCurrencies === totalCurrencies,
        count_required: repo.floatCountRequired,
      };
    });
  }, [repositories, getFloatState, areFloatStacksConfirmed]);

  const handleStartFloat = async () => {
    setStartingCloseOrOpen(true);
    try {
      await startFloat("START_OPEN");
      // Refresh the active session to get updated status
      await refreshActiveSession();
      // Refresh float data to show updated repository states
      await refetch();
      notifications.show({
        title: "Success",
        message: "Float opening started",
        color: "green",
      });
    } catch (error) {
      console.error("Start float error:", error);
      notifications.show({
        title: "Error",
        message: "Failed to start float opening",
        color: "red",
      });
    } finally {
      setStartingCloseOrOpen(false);
    }
  };

  const handleConfirmFloat = async () => {
    setStartingCloseOrOpen(true);
    try {
      await confirmFloat("CONFIRM_OPEN");
      // Refresh the active session to get updated status
      await refreshActiveSession();
      // Refresh float data to show updated repository states
      await refetch();
      notifications.show({
        title: "Success",
        message: "Float opening confirmed",
        color: "green",
      });
    } catch (error) {
      console.error("Confirm float error:", error);
      notifications.show({
        title: "Error",
        message: "Failed to confirm float opening",
        color: "red",
      });
    } finally {
      setStartingCloseOrOpen(false);
    }
  };

  const handleCloseFloat = async () => {
    setStartingCloseOrOpen(true);
    try {
      await startFloat("START_CLOSE");
      // Refresh the active session to get updated status
      await refreshActiveSession();
      // Refresh float data to show updated repository states
      await refetch();
      notifications.show({
        title: "Success",
        message: "Float closing started",
        color: "green",
      });
    } catch (error) {
      console.error("Close float error:", error);
      notifications.show({
        title: "Error",
        message: "Failed to start float closing",
        color: "red",
      });
    } finally {
      setStartingCloseOrOpen(false);
    }
  };

  const handleCloseSession = () => {
    if (!activeSession?._id) {
      const error = "No active session found";
      console.error("Close session error:", error);
      notifications.show({
        title: "Error",
        message: error,
        color: "red",
      });
      return;
    }
    openCloseValidation();
  };

  const handleConfirmCloseSession = async () => {
    if (!activeSession?._id) return;

    setStartingCloseOrOpen(true);
    try {
      const result = await closeSession(activeSession._id);
      
      if (result.success) {
        notifications.show({
          title: "Success",
          message: result.message || "Session closed successfully",
          color: "green",
        });
        
        closeCloseValidation();
        
        // Refresh the active session to get updated status
        await refreshActiveSession();
        // Refresh float data to show updated repository states
        await refetch();
        
        // Show session stats modal
        openSessionStats();
      } else {
        const error = result.message || "Failed to close session";
        console.error("Close session failed:", error);
        notifications.show({
          title: "Error",
          message: error,
          color: "red",
        });
      }
    } catch (error: any) {
      const errorMessage = error.message || "Failed to close session";
      console.error("Close session error:", error);
      notifications.show({
        title: "Error",
        message: errorMessage,
        color: "red",
      });
    } finally {
      setStartingCloseOrOpen(false);
    }
  };

  const handleCancelClose = async () => {
    setStartingCloseOrOpen(true);
    try {
      await startFloat("CANCEL_CLOSE");
      // Refresh the active session to get updated status
      await refreshActiveSession();
      // Refresh float data to show updated repository states
      await refetch();
      notifications.show({
        title: "Success",
        message: "Float close cancelled",
        color: "green",
      });
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to cancel float close",
        color: "red",
      });
    } finally {
      setStartingCloseOrOpen(false);
    }
  };

  const handleConfirmedRepo = (id: string) => {
    setConfirmedReposIds((prev) => [...prev, id]);
  };

  const handleUpdateRepositoryFloat = async (
    repositoryId: string,
    floatStacks: any[]
  ) => {
    try {
      // Update each float stack individually since the Convex hook works with individual stacks
      for (const stack of floatStacks) {
        await updateRepositoryFloat({
          floatStackId: stack.id,
          updates: {
            openCount: stack.openCount,
            closeCount: stack.closeCount,
            middayCount: stack.middayCount,
            openConfirmedDt: stack.openConfirmedDt,
            closeConfirmedDt: stack.closeConfirmedDt,
          },
        });
      }
      notifications.show({
        title: "Success",
        message: "Repository float updated",
        color: "green",
      });
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to update repository float",
        color: "red",
      });
      throw error;
    }
  };

  const handleBypassFloat = async () => {
    // Debug function to skip float
    notifications.show({
      title: "Debug",
      message: "Float bypassed",
      color: "orange",
    });
  };

  // Show loading state when active session is loading
  if (activeSessionLoading) {
    return (
      <Container size="xl" py="xl">
        <Group justify="center">
          <Loader size="lg" />
          <Text>Loading session data...</Text>
        </Group>
      </Container>
    );
  }

  // Show loading state when float data is loading
  if (isLoading) {
    return (
      <Container size="xl" py="xl">
        <Group justify="center">
          <Loader size="lg" />
          <Text>Loading float data...</Text>
        </Group>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="xl" py="xl">
        <Alert icon={<IconAlertTriangle size={16} />} title="Error" color="red">
          Failed to load float data. Please try again.
        </Alert>
      </Container>
    );
  }

  // Show loading state when no active session
  if (!activeSession) {
    return (
      <Container size="xl" py="xl">
        <Alert icon={<IconInfoCircle size={16} />} color="blue">
          No active session found. Please start or join a session first.
        </Alert>
      </Container>
    );
  }

  const floatCloseIsStart = activeSession?.status === "FLOAT_CLOSE_START";
  const useableRepos = repositories.filter((repo) =>
    floatCloseIsStart ? repo.accessLogs?.length > 0 : true
  );

  const isDebugMode = process.env.NODE_ENV === "development";

  return (
    <Container size="xl" py="xl">
      {showSessionStats && (
        <SessionStats
          activeSession={activeSession}
          onClose={closeSessionStats}
        />
      )}

      {showCloseValidation && (
        <CloseSessionValidation
          opened={showCloseValidation}
          onClose={closeCloseValidation}
          onConfirm={handleConfirmCloseSession}
          sessionId={activeSession?._id || ""}
          loading={startingCloseOrOpen}
          validateSession={validateSessionCanClose || (async () => ({ canClose: false, error: "Validation function not available", blockingItems: [] }))}
        />
      )}

      <FloatHeader
        activeSession={activeSession}
        floatData={floatData}
        allFloatsCountStates={allFloatsCountStates}
        startingCloseOrOpen={
          startingCloseOrOpen || isStartingFloat || isConfirmingFloat
        }
        onStartFloat={handleStartFloat}
        onConfirmFloat={handleConfirmFloat}
        onCloseFloat={handleCloseFloat}
        onCloseSession={handleCloseSession}
        onCancelClose={handleCancelClose}
        onBypassFloat={handleBypassFloat}
        isDebugMode={isDebugMode}
      />

      <Alert
        icon={<IconInfoCircle size={16} />}
        title="Float Balance Information"
        color="blue"
        mb="lg"
      >
        Off balance values below 0.01 are not highlighted
      </Alert>

      <Stack gap="md">
        {useableRepos.map((repository, index) => {
          if (!repository.active) return null;

          const countState = allFloatsCountStates.find(
            (repo) => repo.id === repository.id
          );

          return (
            <RepositoryCard
              key={`repository-${index}`}
              repository={repository as any}
              activeSession={activeSession}
              countedCurrencies={countState?.countedCurrencies || 0}
              totalCurrencies={countState?.totalCurrencies || 0}
              startingCloseOrOpen={startingCloseOrOpen || isUpdatingFloat}
              onUpdateRepositoryFloat={handleUpdateRepositoryFloat}
              isDebugMode={isDebugMode}
              last={index === useableRepos.length - 1}
            />
          );
        })}
      </Stack>

      {useableRepos.length === 0 && (
        <Alert
          icon={<IconInfoCircle size={16} />}
          title="No Repositories"
          color="gray"
        >
          No repositories available for this session.
        </Alert>
      )}
    </Container>
  );
}
