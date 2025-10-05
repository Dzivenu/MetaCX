"use client";

import React, { useState, useEffect } from "react";
import { Card, Group, Text, Button, Collapse, ActionIcon } from "@mantine/core";
import {
  IconChevronDown,
  IconChevronUp,
  IconCheck,
  IconLock,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { FloatStackRow } from "./FloatStackRow";
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

type FloatStackUpdate = {
  id: string;
  openCount?: number;
  closeCount?: number;
  openConfirmedDt?: Date;
  closeConfirmedDt?: Date;
};

interface CurrencyFloat {
  id: string;
  ticker: string;
  name: string;
  typeof: string;
  floatStacks: FloatStack[];
}

interface CurrencyPanelProps {
  currencyObj: CurrencyFloat;
  floatState: string;
  disableEdit: boolean;
  autoExpand: boolean;
  firstElement: boolean;
  lastElement: boolean;
  onFloatSubmit: (
    currencyId: string,
    floatStacks: FloatStackUpdate[]
  ) => Promise<void>;
  onSkipFloatCount?: () => void;
  startingCloseOrOpen: boolean;
  isDebugMode?: boolean;
  embedded?: boolean;
}

export const CurrencyPanel: React.FC<CurrencyPanelProps> = ({
  currencyObj,
  floatState,
  disableEdit,
  autoExpand,
  firstElement,
  lastElement,
  onFloatSubmit,
  onSkipFloatCount,
  startingCloseOrOpen,
  isDebugMode = false,
  embedded = false,
}) => {
  // Debug logging for currency panel
  console.log(`💱 CurrencyPanel ${currencyObj.ticker}:`, {
    floatState,
    disableEdit,
    floatStacksCount: currencyObj.floatStacks.length,
    floatStacks: currencyObj.floatStacks.map((s) => ({
      id: s.id.substring(0, 8),
      denomination: s.denomination.name,
      openCount: s.openCount,
      closeCount: s.closeCount,
    })),
  });
  const {
    buildCurrencyPanelState,
    areFloatStacksConfirmed,
    floatAmountIsWithinValidRange,
    sortFloatStacksByValue,
    formatMoney,
    styleBalanceResult,
  } = useFloatCalculations();

  const [expanded, setExpanded] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [floatInputs, setFloatInputs] = useState<
    Record<string, { value: number; count: number }>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const panelState = buildCurrencyPanelState(currencyObj);
  const {
    previousSessionSum,
    openSessionSum,
    closeSessionSum,
    currentSessionSum,
  } = panelState;

  const confirmedCurrency = areFloatStacksConfirmed(
    floatState,
    currencyObj.floatStacks
  );
  const deciCnt = currencyObj.typeof === "Fiat" ? 2 : 8;
  const deciCntCurrent = currencyObj.typeof === "Fiat" ? 0 : 8;

  const openFloatAmountValid = floatAmountIsWithinValidRange(
    openSessionSum,
    previousSessionSum
  );
  const closeFloatAmountValid = floatAmountIsWithinValidRange(
    closeSessionSum,
    currentSessionSum
  );

  const openOffBalance = openSessionSum - previousSessionSum;
  const closeOffBalance = closeSessionSum - currentSessionSum;

  const hasOpenOffBalance = !floatAmountIsWithinValidRange(
    openSessionSum,
    previousSessionSum
  );
  const hasCloseOffBalance = !floatAmountIsWithinValidRange(
    closeSessionSum,
    currentSessionSum
  );

  const showOpenOffBalance =
    hasOpenOffBalance && parseFloat(String(openOffBalance)) !== 0;
  const showCloseOffBalance =
    hasCloseOffBalance && parseFloat(String(closeOffBalance)) !== 0;

  // Auto-expand logic
  useEffect(() => {
    if (autoExpand && !confirmedCurrency) {
      setExpanded(true);
    } else if (confirmedCurrency) {
      setExpanded(false);
      setShowOverlay(true);
    }
  }, [autoExpand, confirmedCurrency]);

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  const collectFloatInput = (
    floatStackId: string,
    value: number,
    count: number
  ) => {
    setFloatInputs((prev) => ({
      ...prev,
      [floatStackId]: { value, count },
    }));
  };

  const handleFloatSubmit = async () => {
    setIsSubmitting(true);
    try {
      const floatStackUpdates = Object.entries(floatInputs).map(
        ([id, data]) => ({
          id,
          [floatState === "OPEN" ? "openCount" : "closeCount"]: data.count,
          [floatState === "OPEN" ? "openConfirmedDt" : "closeConfirmedDt"]:
            new Date(),
        })
      );

      await onFloatSubmit(currencyObj.id, floatStackUpdates);

      setShowOverlay(true);
      setExpanded(false);
      notifications.show({
        title: "Success",
        message: `Float confirmed for ${currencyObj.name}`,
        color: "green",
      });
    } catch (error) {
      console.error(error);
      notifications.show({
        title: "Error",
        message: "Failed to submit float counts",
        color: "red",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeOverlay = () => {
    setShowOverlay(false);
  };

  const getStateIcon = () => {
    if (showOverlay) {
      return <IconCheck size={20} color="white" />;
    } else if (["UNAVAILABLE", "CURRENT"].includes(floatState)) {
      return <IconLock size={20} color="white" />;
    }
    return null;
  };

  const getPanelHeaderStyle = (): React.CSSProperties => {
    let background = "#6b7280"; // gray-500
    if (showOverlay && floatState.includes("CLOSE")) {
      background = closeFloatAmountValid ? "#16a34a" : "#dc2626"; // green-600/red-600
    } else if (showOverlay && floatState.includes("OPEN")) {
      background = openFloatAmountValid ? "#16a34a" : "#dc2626"; // green-600/red-600
    } else if (expanded) {
      background = "#4b5563"; // gray-600
    }
    return {
      backgroundColor: background,
      color: "#ffffff",
      padding: 16,
    };
  };

  const formattedFloatStacks = (currencyObj.floatStacks || []).sort(
    sortFloatStacksByValue
  );

  // Embedded mode: render body content directly without header/collapse/card wrappers
  if (embedded) {
    return (
      <div style={{ position: "relative" }}>
        {/* Column Headers */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 16,
            padding: "12px 16px",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <Text size="sm" fw={600}>
              Value
            </Text>
          </div>
          <div style={{ textAlign: "center" }}>
            <Text size="sm" fw={600}>
              Previous
            </Text>
            <Text size="xs" c="dimmed">
              {formatMoney(previousSessionSum, deciCnt)}
            </Text>
          </div>
          <div
            style={{
              textAlign: "center",
              color: showOpenOffBalance ? "#dc2626" : undefined,
            }}
          >
            <Group justify="center" gap="xs">
              {showOpenOffBalance && <IconAlertTriangle size={14} />}
              <Text size="sm" fw={600}>
                Off-Balance
              </Text>
            </Group>
            <Text
              size="xs"
              className={styleBalanceResult(
                openSessionSum - previousSessionSum
              )}
            >
              {formatMoney(openSessionSum - previousSessionSum, deciCnt)}
            </Text>
          </div>
          <div style={{ textAlign: "center" }}>
            <Text size="sm" fw={600}>
              Open
            </Text>
            <Text size="xs" c="dimmed">
              {formatMoney(openSessionSum, deciCnt)}
            </Text>
          </div>
          <div style={{ textAlign: "center" }}>
            <Text size="sm" fw={600}>
              Expected
            </Text>
            <Text size="xs" c="dimmed">
              {formatMoney(currentSessionSum, deciCnt)}
            </Text>
          </div>
          <div
            style={{
              textAlign: "center",
              color: showCloseOffBalance ? "#dc2626" : undefined,
            }}
          >
            <Group justify="center" gap="xs">
              {showCloseOffBalance && <IconAlertTriangle size={14} />}
              <Text size="sm" fw={600}>
                Off-Balance
              </Text>
            </Group>
            <Text size="xs">
              {formatMoney(closeSessionSum - currentSessionSum, deciCnt)}
            </Text>
          </div>
          <div style={{ textAlign: "center" }}>
            <Text size="sm" fw={600}>
              Close
            </Text>
            <Text size="xs" c="dimmed">
              {formatMoney(closeSessionSum, deciCnt)}
            </Text>
          </div>
        </div>

        {/* Float Stack Rows */}
        <div>
          {formattedFloatStacks.map((stack) => (
            <FloatStackRow
              key={stack.id}
              floatStack={stack}
              floatState={floatState}
              currency={currencyObj}
              deciCnt={deciCntCurrent}
              disableEdit={disableEdit}
              hasOpenOffBalance={hasOpenOffBalance}
              hasCloseOffBalance={hasCloseOffBalance}
              onFloatInputChange={collectFloatInput}
            />
          ))}
        </div>

        {/* Submit Buttons */}
        {!showOverlay && !disableEdit && (
          <div
            style={{
              padding: 16,
              borderTop: "1px solid #e5e7eb",
            }}
          >
            <Group justify="flex-end" gap="md">
              {isDebugMode && (
                <Button
                  variant="outline"
                  color="red"
                  onClick={onSkipFloatCount}
                  disabled={startingCloseOrOpen}
                  size="sm"
                >
                  Skip count
                </Button>
              )}

              <Button
                onClick={handleFloatSubmit}
                disabled={startingCloseOrOpen || isSubmitting}
                loading={isSubmitting}
                size="sm"
              >
                Confirm count
              </Button>
            </Group>
          </div>
        )}

        {/* Confirmed Overlay */}
        {showOverlay && (
          <div
            onClick={removeOverlay}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.65)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              cursor: "pointer",
            }}
          >
            <IconCheck size={60} className="mb-2" />
            <Text size="lg" fw={600}>
              Float confirmed!
            </Text>
            <Text size="sm" className="underline">
              Click here to edit
            </Text>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card
      className={`overflow-hidden ${firstElement ? "rounded-t-lg" : ""} ${
        lastElement ? "rounded-b-lg" : ""
      }`}
      padding={0}
      radius={0}
    >
      {/* Header */}
      <div style={getPanelHeaderStyle()} onClick={toggleExpanded}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 16,
            alignItems: "center",
          }}
        >
          {/* State Icon */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            {getStateIcon()}
          </div>

          {/* Currency Info */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                background: "#ffffff",
                borderRadius: 999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text size="xs" fw={700} c="dark">
                {currencyObj.ticker.substring(0, 2)}
              </Text>
            </div>
            <Text
              size="sm"
              fw={600}
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {currencyObj.name}
            </Text>
          </div>

          {/* Total Sum */}
          <div style={{ textAlign: "center" }}>
            <Text size="sm" fw={600}>
              {formatMoney(currentSessionSum, deciCnt)} {currencyObj.ticker}
            </Text>
          </div>

          {/* Equivalent in Base Currency */}
          <div style={{ textAlign: "center" }}>
            <Text size="xs" fs="italic">
              ~ {formatMoney(currentSessionSum, 0)} CAD
            </Text>
          </div>

          {/* Open Off-balance */}
          <div style={{ textAlign: "center" }}>
            {showOpenOffBalance && (
              <div
                style={{
                  background: "#dc2626",
                  color: "#ffffff",
                  padding: "4px 8px",
                  borderRadius: 4,
                  fontSize: 12,
                }}
              >
                Open Off-balance:
                <br />
                {formatMoney(openOffBalance, deciCnt)} {currencyObj.ticker}
              </div>
            )}
          </div>

          {/* Close Off-balance */}
          <div style={{ textAlign: "center" }}>
            {showCloseOffBalance && (
              <div
                style={{
                  background: "#dc2626",
                  color: "#ffffff",
                  padding: "4px 8px",
                  borderRadius: 4,
                  fontSize: 12,
                }}
              >
                Close Off-balance:
                <br />
                {formatMoney(closeOffBalance, deciCnt)} {currencyObj.ticker}
              </div>
            )}
          </div>

          {/* Expand Icon */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <ActionIcon variant="transparent" size="sm">
              {expanded ? (
                <IconChevronUp size={16} color="white" />
              ) : (
                <IconChevronDown size={16} color="white" />
              )}
            </ActionIcon>
          </div>
        </div>
      </div>

      {/* Body */}
      <Collapse in={expanded}>
        <div style={{ position: "relative" }}>
          {/* Column Headers */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 16,
              padding: "12px 16px",
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <Text size="sm" fw={600}>
                Value
              </Text>
            </div>
            <div style={{ textAlign: "center" }}>
              <Text size="sm" fw={600}>
                Previous
              </Text>
              <Text size="xs" c="dimmed">
                {formatMoney(previousSessionSum, deciCnt)}
              </Text>
            </div>
            <div
              style={{
                textAlign: "center",
                color: showOpenOffBalance ? "#dc2626" : undefined,
              }}
            >
              <Group justify="center" gap="xs">
                {showOpenOffBalance && <IconAlertTriangle size={14} />}
                <Text size="sm" fw={600}>
                  Off-Balance
                </Text>
              </Group>
              <Text
                size="xs"
                className={styleBalanceResult(
                  openSessionSum - previousSessionSum
                )}
              >
                {formatMoney(openSessionSum - previousSessionSum, deciCnt)}
              </Text>
            </div>
            <div style={{ textAlign: "center" }}>
              <Text size="sm" fw={600}>
                Open
              </Text>
              <Text size="xs" c="dimmed">
                {formatMoney(openSessionSum, deciCnt)}
              </Text>
            </div>
            <div style={{ textAlign: "center" }}>
              <Text size="sm" fw={600}>
                Expected
              </Text>
              <Text size="xs" c="dimmed">
                {formatMoney(currentSessionSum, deciCnt)}
              </Text>
            </div>
            <div
              style={{
                textAlign: "center",
                color: showCloseOffBalance ? "#dc2626" : undefined,
              }}
            >
              <Group justify="center" gap="xs">
                {showCloseOffBalance && <IconAlertTriangle size={14} />}
                <Text size="sm" fw={600}>
                  Off-Balance
                </Text>
              </Group>
              <Text size="xs">
                {formatMoney(closeSessionSum - currentSessionSum, deciCnt)}
              </Text>
            </div>
            <div style={{ textAlign: "center" }}>
              <Text size="sm" fw={600}>
                Close
              </Text>
              <Text size="xs" c="dimmed">
                {formatMoney(closeSessionSum, deciCnt)}
              </Text>
            </div>
          </div>

          {/* Float Stack Rows */}
          <div>
            {formattedFloatStacks.map((stack) => (
              <FloatStackRow
                key={stack.id}
                floatStack={stack}
                floatState={floatState}
                currency={currencyObj}
                deciCnt={deciCntCurrent}
                disableEdit={disableEdit}
                hasOpenOffBalance={hasOpenOffBalance}
                hasCloseOffBalance={hasCloseOffBalance}
                onFloatInputChange={collectFloatInput}
              />
            ))}
          </div>

          {/* Submit Buttons */}
          {!showOverlay && !disableEdit && (
            <div
              style={{
                padding: 16,
                borderTop: "1px solid #e5e7eb",
              }}
            >
              <Group justify="flex-end" gap="md">
                {isDebugMode && (
                  <Button
                    variant="outline"
                    color="red"
                    onClick={onSkipFloatCount}
                    disabled={startingCloseOrOpen}
                    size="sm"
                  >
                    Skip count
                  </Button>
                )}

                <Button
                  onClick={handleFloatSubmit}
                  disabled={startingCloseOrOpen || isSubmitting}
                  loading={isSubmitting}
                  size="sm"
                >
                  Confirm count
                </Button>
              </Group>
            </div>
          )}

          {/* Confirmed Overlay */}
          {showOverlay && (
            <div
              onClick={removeOverlay}
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.65)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                cursor: "pointer",
              }}
            >
              <IconCheck size={60} className="mb-2" />
              <Text size="lg" fw={600}>
                Float confirmed!
              </Text>
              <Text size="sm" className="underline">
                Click here to edit
              </Text>
            </div>
          )}
        </div>
      </Collapse>
    </Card>
  );
};
