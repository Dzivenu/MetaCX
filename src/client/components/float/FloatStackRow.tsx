"use client";

import React, { useState, useRef, useEffect } from "react";
import { Group, Text, Button, NumberInput } from "@mantine/core";
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

interface CurrencyShape {
  ticker: string;
  typeof: string;
}

interface FloatStackRowProps {
  floatStack: FloatStack;
  floatState: string;
  currency: CurrencyShape;
  deciCnt: number;
  disableEdit: boolean;
  hasOpenOffBalance: boolean;
  hasCloseOffBalance: boolean;
  onFloatInputChange: (
    floatStackId: string,
    value: number,
    count: number
  ) => void;
  onFocusNextStack?: () => void;
}

const RollCalculator: React.FC<{
  onSubmit: (coinCount: number, rollCount: number) => void;
  onClose: () => void;
  disableEdit: boolean;
}> = ({ onSubmit, onClose, disableEdit }) => {
  const [coinCount, setCoinCount] = useState(0);
  const [rollCount, setRollCount] = useState(0);

  const handleSubmit = () => {
    onSubmit(coinCount, rollCount);
    onClose();
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg mt-2">
      <Text size="sm" fw={600} mb="md">
        Coin Calculator
      </Text>
      <Group grow mb="md">
        <NumberInput
          label="# Coins"
          value={coinCount}
          onChange={(value) => setCoinCount(Number(value) || 0)}
          disabled={disableEdit}
          min={0}
        />
        <NumberInput
          label="# Rolls"
          value={rollCount}
          onChange={(value) => setRollCount(Number(value) || 0)}
          disabled={disableEdit}
          min={0}
        />
      </Group>
      <Group justify="flex-end">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={disableEdit}>
          Calculate
        </Button>
      </Group>
    </div>
  );
};

export const FloatStackRow: React.FC<FloatStackRowProps> = ({
  floatStack,
  floatState,
  currency,
  deciCnt,
  disableEdit,
  hasOpenOffBalance,
  hasCloseOffBalance,
  onFloatInputChange,
  onFocusNextStack,
}) => {
  const { formatMoney } = useFloatCalculations();
  const [openCount, setOpenCount] = useState(floatStack.openCount);
  const [closeCount, setCloseCount] = useState(floatStack.closeCount);
  const [showRollCalculator, setShowRollCalculator] = useState(false);

  const openInputRef = useRef<HTMLInputElement>(null);
  const closeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setOpenCount(floatStack.openCount);
    setCloseCount(floatStack.closeCount);
  }, [floatStack.openCount, floatStack.closeCount]);

  const applyPreviousCount = (targetValue: "openCount" | "closeCount") => {
    const computedTargetValue =
      targetValue === "openCount"
        ? floatStack.lastSessionCount
        : parseFloat(String(floatStack.openCount)) -
          parseFloat(String(floatStack.spentDuringSession)) -
          parseFloat(String(floatStack.transferredDuringSession));

    if (targetValue === "openCount") {
      setOpenCount(computedTargetValue);
    } else {
      setCloseCount(computedTargetValue);
    }

    onFloatInputChange(
      floatStack.id,
      floatStack.denominatedValue,
      computedTargetValue
    );

    if (onFocusNextStack) {
      onFocusNextStack();
    }
  };

  const handleFloatInputChange = (
    value: number,
    targetName: "openCount" | "closeCount"
  ) => {
    const count = value || 0;

    if (targetName === "openCount") {
      setOpenCount(count);
    } else {
      setCloseCount(count);
    }

    onFloatInputChange(floatStack.id, floatStack.denominatedValue, count);
  };

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    event.target.select();

    // Show roll calculator for $2 and $1 CAD denominations
    const toonie = currency.ticker === "CAD" && floatStack.value === 2;
    const loonie = currency.ticker === "CAD" && floatStack.value === 1;
    if (toonie || loonie) {
      setShowRollCalculator(true);
    }
  };

  const submitCounts = (coinCount: number, rollCount: number) => {
    // 1 roll = 25 coins
    const totalCount = coinCount + rollCount * 25;

    if (floatState === "OPEN") {
      setOpenCount(totalCount);
      onFloatInputChange(
        floatStack.id,
        floatStack.denominatedValue,
        totalCount
      );
    }
    if (floatState === "CLOSE") {
      setCloseCount(totalCount);
      onFloatInputChange(
        floatStack.id,
        floatStack.denominatedValue,
        totalCount
      );
    }

    setShowRollCalculator(false);
  };

  const onKeyUp = (
    e: React.KeyboardEvent,
    targetName: "openCount" | "closeCount"
  ) => {
    if (e.key === "p") {
      applyPreviousCount(targetName);
    }
  };

  const expectedOpenBalance = formatMoney(floatStack.lastSessionCount, deciCnt);
  const openOffBalanceSign =
    floatStack.lastSessionCount - openCount < 0 ? "+" : "";
  const openOffBalance = (openCount - floatStack.lastSessionCount).toFixed(
    deciCnt
  );

  const expectedCloseBalance =
    floatStack.openConfirmedDt === null
      ? floatStack.lastSessionCount
      : openCount -
        parseFloat(String(floatStack.spentDuringSession)) -
        parseFloat(String(floatStack.transferredDuringSession));

  const expectedCloseBalanceFormatted = formatMoney(
    expectedCloseBalance,
    deciCnt
  );
  const closeOffBalanceSign = expectedCloseBalance - closeCount < 0 ? "+" : "";
  const closeOffBalance = (closeCount - expectedCloseBalance).toFixed(deciCnt);

  const showOpenOffBalance =
    hasOpenOffBalance &&
    parseFloat(openOffBalance) !== 0 &&
    parseFloat(String(openCount)) &&
    parseFloat(String(openCount)) !== 0;
  const showCloseOffBalance =
    hasCloseOffBalance &&
    parseFloat(closeOffBalance) !== 0 &&
    parseFloat(String(closeCount)) &&
    parseFloat(String(closeCount)) !== 0;

  return (
    <div style={{ borderBottom: "1px solid #e5e7eb" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 16,
          padding: "12px 16px",
          alignItems: "center",
        }}
      >
        {/* Denomination value */}
        <div
          style={{
            textAlign: "center",
            fontWeight: 600,
            borderRight: "1px solid #e5e7eb",
          }}
        >
          {floatStack.denomination?.value ?? floatStack.value}
        </div>

        {/* Expected balance */}
        <div style={{ textAlign: "center" }}>
          <Text size="sm" c="dimmed" fs="italic">
            {expectedOpenBalance}
          </Text>
        </div>

        {/* Open off balance */}
        <div
          style={{
            textAlign: "center",
            color: showOpenOffBalance ? "#dc2626" : undefined,
          }}
        >
          <Text size="sm">
            {openOffBalanceSign}
            {openOffBalance}
          </Text>
        </div>

        {/* Open count input */}
        <div style={{ textAlign: "center" }}>
          <NumberInput
            ref={openInputRef}
            value={openCount}
            onChange={(value) =>
              handleFloatInputChange(Number(value) || 0, "openCount")
            }
            onFocus={handleFocus}
            onKeyDown={(e) => onKeyUp(e, "openCount")}
            disabled={disableEdit || floatState !== "OPEN"}
            size="sm"
            styles={{
              input: {
                textAlign: "center",
              },
            }}
            step={currency.typeof === "Fiat" ? 0.01 : 0.00000001}
            decimalScale={currency.typeof === "Fiat" ? 2 : 8}
          />
        </div>

        {/* Expected close balance */}
        <div style={{ textAlign: "center" }}>
          <Text size="sm" c="dimmed" fs="italic">
            {expectedCloseBalanceFormatted}
          </Text>
        </div>

        {/* Close off balance */}
        <div
          style={{
            textAlign: "center",
            color: showCloseOffBalance ? "#dc2626" : undefined,
          }}
        >
          <Text size="sm">
            {closeOffBalanceSign}
            {closeOffBalance}
          </Text>
        </div>

        {/* Close count input */}
        <div style={{ textAlign: "center" }}>
          <NumberInput
            ref={closeInputRef}
            value={closeCount}
            onChange={(value) =>
              handleFloatInputChange(Number(value) || 0, "closeCount")
            }
            onFocus={handleFocus}
            onKeyDown={(e) => onKeyUp(e, "closeCount")}
            disabled={disableEdit || floatState !== "CLOSE"}
            size="sm"
            styles={{
              input: {
                textAlign: "center",
              },
            }}
            step={currency.typeof === "Fiat" ? 0.01 : 0.00000001}
            decimalScale={currency.typeof === "Fiat" ? 2 : 8}
          />
        </div>
      </div>

      {/* Roll Calculator */}
      {showRollCalculator && (
        <RollCalculator
          onSubmit={submitCounts}
          onClose={() => setShowRollCalculator(false)}
          disableEdit={disableEdit}
        />
      )}
    </div>
  );
};
