"use client";

import React, { useState, useMemo } from "react";
import { Card, Group, Text, Button, Badge, Alert } from "@mantine/core";
import {
  CollapsibleRowTable,
  CurrencyRender,
} from "@/client/components/blocks";
import type { DataTableColumn } from "mantine-datatable";
import {
  IconUser,
  IconFlag,
  IconHourglass,
  IconInfoCircle,
} from "@tabler/icons-react";
import { CurrencyPanel } from "./CurrencyPanel";
import { useFloatCalculations } from "@/client/hooks/use-float-calculations";

interface FloatStack {
  id: string;
  openCount: number;
  closeCount: number;
  middayCount: number;
  lastSessionCount: number;
  spentDuringSession: string;
  transferredDuringSession: number;
  denominatedValue: number;
  ticker: string;
  openSpot: number;
  closeSpot: number;
  averageSpot: number;
  openConfirmedDt: Date | null;
  closeConfirmedDt: Date | null;
  value: number;
  denomination: {
    id: string;
    value: number;
    name: string;
  };
}

interface CurrencyFloat {
  id: string;
  ticker: string;
  name: string;
  typeof: string;
  floatStacks: FloatStack[];
}

interface Repository {
  id: string;
  name: string;
  floatCountRequired: boolean;
  active: boolean;
  state: string;
  accessLogs: AccessLog[];
  float: CurrencyFloat[];
}

interface AccessLog {
  orgSessionId?: string;
  userId?: string;
  openStartDt?: number | null;
  openConfirmDt?: number | null;
  closeStartDt?: number | null;
  closeConfirmDt?: number | null;
  updatedAt?: number;
}

interface ActiveSession {
  _id?: string;
  id?: string;
  activeUserId?: string;
  authorizedUserIds?: string[];
  userId?: string;
  status?: string;
  createdBy?: string;
}

type FloatStackUpdate = {
  id: string;
  openCount?: number;
  closeCount?: number;
  openConfirmedDt?: Date;
  closeConfirmedDt?: Date;
};

interface RepositoryCardProps {
  repository: Repository;
  activeSession: ActiveSession;
  countedCurrencies: number;
  totalCurrencies: number;
  startingCloseOrOpen: boolean;
  onUpdateRepositoryFloat: (
    repositoryId: string,
    floatStacks: FloatStackUpdate[]
  ) => Promise<void>;
  onSkipAllFloatCounts?: () => void;
  isDebugMode?: boolean;
  last?: boolean;
}

const FloatTrack: React.FC<{
  countedCurrencies: number;
  totalCurrencies: number;
}> = ({ countedCurrencies, totalCurrencies }) => {
  const isComplete = countedCurrencies === totalCurrencies;

  return (
    <Text size="sm" fw={700} c={isComplete ? "green" : "red"} className="mr-3">
      {countedCurrencies}/{totalCurrencies} Currencies Counted
    </Text>
  );
};

export const RepositoryCard: React.FC<RepositoryCardProps> = ({
  repository,
  activeSession,
  countedCurrencies,
  totalCurrencies,
  startingCloseOrOpen,
  onUpdateRepositoryFloat,
  onSkipAllFloatCounts,
  isDebugMode = false,
  last = false,
}) => {
  const {
    getFloatState,
    buildCurrencyPanelState,
    formatMoney,
    styleBalanceResult,
  } = useFloatCalculations();
  const [busy, setBusy] = useState(false);

  const floatState = getFloatState(repository.state);
  const floatStacksCountComplete = countedCurrencies === totalCurrencies;
  const expandCurrencyPanel = ["OPEN_START", "CLOSE_START"].includes(
    repository.state
  );

  const disableCurrencyEdit =
    repository.state === "OPEN_CONFIRMED"
      ? false
      : activeSession?.status === "FLOAT_OPEN_START" &&
          repository.state === "DORMANT"
        ? true
        : !expandCurrencyPanel;

  // Debug logging for currency edit logic
  console.log(`🔧 ${repository.name} edit logic:`, {
    repositoryState: repository.state,
    activeSessionStatus: activeSession?.status,
    expandCurrencyPanel,
    disableCurrencyEdit,
    floatCount: repository.float.length,
  });

  const isUserAuthorized = useMemo(() => {
    // Since the user can access the float page, they're likely authorized
    // More sophisticated auth would require current user context
    return !!activeSession;
  }, [activeSession]);

  const modeText = repository.floatCountRequired
    ? "COUNT REQUIRED"
    : "COUNT OPTIONAL";
  const badgeColor = repository.floatCountRequired ? "red" : "gray";

  // Determine latest access log for this repository (from Convex data)
  const sortedAccessLogs = useMemo(() => {
    const logs = repository.accessLogs || [];
    return [...logs].sort((a, b) => (a.updatedAt || 0) - (b.updatedAt || 0));
  }, [repository.accessLogs]);
  const currentRepoAccessLog =
    sortedAccessLogs[sortedAccessLogs.length - 1] || {};

  // Get current user info from activeSession, not access logs
  const currentUserId = activeSession?.activeUserId || activeSession?.userId;

  // Columns for currencies table (currency-level metrics)
  const currencyColumns: DataTableColumn<CurrencyFloat>[] = [
    {
      accessor: "currency",
      title: "Currency",
      width: 200,
      render: (record) => (
        <CurrencyRender ticker={record.ticker} name={record.name} size="sm" />
      ),
    },
    {
      accessor: "value_total",
      title: (
        <div style={{ textAlign: "center" }}>
          <Text size="sm" fw={600}>
            Value
          </Text>
          <Text size="xs" c="dimmed">
            Total
          </Text>
        </div>
      ),
      textAlign: "center",
      render: (record) => {
        const { currentSessionSum } = buildCurrencyPanelState(record);
        const deciCnt = record.typeof === "Fiat" ? 2 : 8;
        return (
          <Text>
            {formatMoney(currentSessionSum, deciCnt)} {record.ticker}
          </Text>
        );
      },
    },
    {
      accessor: "previous",
      title: "Previous",
      textAlign: "center",
      render: (record) => {
        const { previousSessionSum } = buildCurrencyPanelState(record);
        const deciCnt = record.typeof === "Fiat" ? 2 : 8;
        return <Text>{formatMoney(previousSessionSum, deciCnt)}</Text>;
      },
    },
    {
      accessor: "off_balance_open",
      title: "Off-Balance",
      textAlign: "center",
      render: (record) => {
        const { previousSessionSum, openSessionSum } =
          buildCurrencyPanelState(record);
        const deciCnt = record.typeof === "Fiat" ? 2 : 8;
        const diff = openSessionSum - previousSessionSum;
        return (
          <Text className={styleBalanceResult(diff)}>
            {formatMoney(diff, deciCnt)}
          </Text>
        );
      },
    },
    {
      accessor: "open",
      title: "Open",
      textAlign: "center",
      render: (record) => {
        const { openSessionSum } = buildCurrencyPanelState(record);
        const deciCnt = record.typeof === "Fiat" ? 2 : 8;
        return <Text>{formatMoney(openSessionSum, deciCnt)}</Text>;
      },
    },
    {
      accessor: "expected",
      title: "Expected",
      textAlign: "center",
      render: (record) => {
        const { currentSessionSum } = buildCurrencyPanelState(record);
        const deciCnt = record.typeof === "Fiat" ? 2 : 8;
        return <Text>{formatMoney(currentSessionSum, deciCnt)}</Text>;
      },
    },
    {
      accessor: "off_balance_close",
      title: "Off-Balance",
      textAlign: "center",
      render: (record) => {
        const { closeSessionSum, currentSessionSum } =
          buildCurrencyPanelState(record);
        const deciCnt = record.typeof === "Fiat" ? 2 : 8;
        const diff = closeSessionSum - currentSessionSum;
        return (
          <Text className={styleBalanceResult(diff)}>
            {formatMoney(diff, deciCnt)}
          </Text>
        );
      },
    },
    {
      accessor: "close",
      title: "Close",
      textAlign: "center",
      render: (record) => {
        const { closeSessionSum } = buildCurrencyPanelState(record);
        const deciCnt = record.typeof === "Fiat" ? 2 : 8;
        return <Text>{formatMoney(closeSessionSum, deciCnt)}</Text>;
      },
    },
  ];

  const handleSkipAllFloatCounts = async () => {
    setBusy(true);
    try {
      if (onSkipAllFloatCounts) {
        await onSkipAllFloatCounts();
      }
    } catch (error) {
      console.error("Error skipping float counts:", error);
    } finally {
      setBusy(false);
    }
  };

  const handleFloatSubmit = async (
    currencyId: string,
    floatStacks: FloatStackUpdate[]
  ) => {
    await onUpdateRepositoryFloat(repository.id, floatStacks);
  };

  const handleSkipFloatCount = async (currencyObj: CurrencyFloat) => {
    // Skip logic for individual currency
    const floatStacks = currencyObj.floatStacks.map((stack) => ({
      id: stack.id,
      [floatState === "OPEN" ? "openCount" : "closeCount"]:
        stack.lastSessionCount,
      [floatState === "OPEN" ? "openConfirmedDt" : "closeConfirmedDt"]:
        new Date(),
    }));

    await onUpdateRepositoryFloat(repository.id, floatStacks);
  };

  const canShowRepository = () => {
    // Show repository info if we have an active session
    return !!activeSession && !!currentUserId;
  };

  return (
    <Card
      className={`mb-6 ${
        repository.floatCountRequired ? "border-4 border-black" : ""
      } ${last ? "mb-0" : ""}`}
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
    >
      {/* Repository Header */}
      <Card.Section className="p-4 border-b">
        <Group justify="space-between" align="flex-start">
          <div className="flex-1">
            <Group mb="xs">
              <Text size="lg" fw={600}>
                {repository.name}
              </Text>
              <Badge color={badgeColor} size="sm">
                {modeText}
              </Badge>
            </Group>

            {/* Repository Info */}
            {canShowRepository() && (
              <Group gap="lg" mt="md">
                <Group gap="xs">
                  <IconUser size={14} />
                  <Text size="sm" c="dimmed">
                    Current user:{" "}
                    {currentUserId
                      ? currentUserId.substring(0, 8) + "..."
                      : "None"}
                  </Text>
                </Group>
                <Group gap="xs">
                  <IconFlag size={14} />
                  <Text size="sm" c="dimmed">
                    Status: {repository.state}
                  </Text>
                </Group>
                <Group gap="xs">
                  <IconHourglass size={14} />
                  <Text size="sm" c="dimmed">
                    Session: {activeSession?.id?.substring(0, 8)}...
                  </Text>
                </Group>
              </Group>
            )}
          </div>

          {/* Action Buttons */}
          {isUserAuthorized &&
            (repository.state === "OPEN_START" ||
              repository.state === "CLOSE_START") && (
              <Group>
                <FloatTrack
                  countedCurrencies={countedCurrencies}
                  totalCurrencies={totalCurrencies}
                />

                {!floatStacksCountComplete && isDebugMode && (
                  <Button
                    variant="outline"
                    color="red"
                    onClick={handleSkipAllFloatCounts}
                    disabled={busy || startingCloseOrOpen}
                    loading={busy}
                    size="sm"
                  >
                    Skip All
                  </Button>
                )}
              </Group>
            )}
        </Group>
      </Card.Section>

      {/* Repository Body */}
      <Card.Section className="p-4">
        {/* Access Denied Messages */}
        {!isUserAuthorized &&
          repository.float &&
          repository.state !== "DORMANT" && (
            <Alert
              icon={<IconInfoCircle size={16} />}
              title="Access Denied"
              color="red"
              mb="md"
            >
              You don't have permission to access this repository's float
            </Alert>
          )}

        {/* Show authorized users info if needed */}
        {activeSession?.authorizedUserIds &&
          activeSession.authorizedUserIds.length > 1 && (
            <Alert
              icon={<IconInfoCircle size={16} />}
              title="Session Info"
              color="blue"
              mb="md"
            >
              <Text mb="xs">
                This session has {activeSession.authorizedUserIds.length}{" "}
                authorized users.
              </Text>
            </Alert>
          )}

        {/* Currencies as rows using CollapsibleRowTable */}
        {isUserAuthorized && repository.float.length > 0 && (
          <CollapsibleRowTable<CurrencyFloat>
            records={repository.float}
            idAccessor={(c) => `${repository.id}:${c.id ?? c.ticker}`}
            columns={currencyColumns}
            allowMultiple={false}
            withTableBorder
            withColumnBorders
            striped
            highlightOnHover
            emptyStateMessage="No currencies"
            renderExpandedContent={(currency: CurrencyFloat) => (
              <div style={{ padding: 12 }}>
                <CurrencyPanel
                  key={`${repository.id}-${currency.id}`}
                  currencyObj={currency}
                  floatState={floatState}
                  disableEdit={disableCurrencyEdit}
                  autoExpand={false}
                  firstElement={false}
                  lastElement={false}
                  onFloatSubmit={handleFloatSubmit}
                  onSkipFloatCount={() => handleSkipFloatCount(currency)}
                  startingCloseOrOpen={startingCloseOrOpen}
                  isDebugMode={isDebugMode}
                  embedded={true}
                />
              </div>
            )}
          />
        )}

        {/* No Permission Message */}
        {!isUserAuthorized &&
          repository.float &&
          repository.state !== "DORMANT" && (
            <div className="text-center py-8">
              <Text fs="italic" c="dimmed">
                You don&apos;t have permission to view this repository&apos;s
                float count for this session.
              </Text>
            </div>
          )}
      </Card.Section>
    </Card>
  );
};
