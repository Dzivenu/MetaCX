import { useMemo } from "react";

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
}

interface CurrencyFloat {
  id: string;
  ticker: string;
  name: string;
  typeof: string;
  floatStacks: FloatStack[];
}

export const SESSION_FLOAT_OFF_BALANCE_THRESHOLD = 0.01;

export const useFloatCalculations = () => {
  const countFloatSum = useMemo(() => {
    return (type: string, floatStacks: FloatStack[]) => {
      let sum = 0;

      // Check if floatStacks exists and is an array
      if (!floatStacks || !Array.isArray(floatStacks)) {
        return sum;
      }

      if (type === "__CURRENT") {
        floatStacks.forEach((stack) => {
          const openCount = Number(stack.openCount) || 0;
          const spentDuringSession = Number(stack.spentDuringSession) || 0;
          const transferredDuringSession =
            Number(stack.transferredDuringSession) || 0;
          const value = Number(stack.value) || 0;

          const amount =
            (openCount - spentDuringSession - transferredDuringSession) * value;
          if (amount + 1 > amount) sum += amount;
        });
      } else {
        floatStacks.forEach((stack) => {
          const quantity = (stack as any)[type] ? (stack as any)[type] : 0;
          sum += quantity * stack.value;
        });
      }
      return sum;
    };
  }, []);

  const buildCurrencyPanelState = useMemo(() => {
    return (currencyObj: CurrencyFloat) => {
      const floatStacks = currencyObj.floatStacks;

      return {
        floatSum: 0,
        previousSessionSum: countFloatSum("lastSessionCount", floatStacks),
        openSessionSum: countFloatSum("openCount", floatStacks),
        middaySum: countFloatSum("middayCount", floatStacks),
        closeSessionSum: countFloatSum("closeCount", floatStacks),
        currentSessionSum: countFloatSum("__CURRENT", floatStacks),
      };
    };
  }, [countFloatSum]);

  const areFloatStacksConfirmed = useMemo(() => {
    return (floatState: string, floatStacks: FloatStack[]) => {
      // Check if floatStacks exists and is an array
      if (!floatStacks || !Array.isArray(floatStacks)) {
        return false;
      }

      const confirmedFloatStacks = floatStacks.filter((fl) => {
        switch (floatState) {
          case "OPEN":
          case "OPEN_START":
          case "OPEN_CONFIRMED":
            return !!fl.openConfirmedDt;
          case "CLOSE":
          case "CLOSE_START":
          case "CLOSE_CONFIRMED":
            return !!fl.closeConfirmedDt;
          default:
            return false;
        }
      });

      return confirmedFloatStacks.length === floatStacks.length;
    };
  }, []);

  const floatAmountIsWithinValidRange = useMemo(() => {
    return (amountA: number, amountB: number) => {
      const a = amountA ?? 0;
      const b = amountB ?? 0;

      const difference = parseFloat(parseFloat(Math.abs(a - b)).toPrecision(4));

      return difference <= SESSION_FLOAT_OFF_BALANCE_THRESHOLD;
    };
  }, []);

  const sortFloatStacksByValue = useMemo(() => {
    return (a: FloatStack, b: FloatStack) => {
      if (a.value > b.value) {
        return -1;
      } else if (a.value < b.value) {
        return 1;
      } else {
        return 0;
      }
    };
  }, []);

  const formatMoney = useMemo(() => {
    return (amount: number, decimals: number = 2) => {
      return new Intl.NumberFormat("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(amount);
    };
  }, []);

  const getRepositoryState = useMemo(() => {
    return (repository: any) => {
      const accessLogs = repository.accessLogs || [];
      if (accessLogs.length === 0) return "DORMANT";

      const latestLog = accessLogs[accessLogs.length - 1];

      if (latestLog.closeConfirmDt) {
        return "DORMANT";
      } else if (latestLog.closeStartDt) {
        return "CLOSE_START";
      } else if (latestLog.openConfirmDt) {
        return "OPEN_CONFIRMED";
      } else if (latestLog.openStartDt) {
        return "OPEN_START";
      } else {
        return "DORMANT";
      }
    };
  }, []);

  const getFloatState = useMemo(() => {
    return (repositoryState: string) => {
      switch (repositoryState) {
        case "OPEN_START":
          return "OPEN";
        case "CLOSE_START":
          return "CLOSE";
        case "OPEN_CONFIRMED":
          return "CURRENT";
        default:
          return "UNAVAILABLE";
      }
    };
  }, []);

  const calculateOffBalance = useMemo(() => {
    return (expected: number, actual: number) => {
      return actual - expected;
    };
  }, []);

  const styleBalanceResult = useMemo(() => {
    return (balance: number) => {
      if (Math.abs(balance) <= SESSION_FLOAT_OFF_BALANCE_THRESHOLD) {
        return "text-green-600";
      } else if (balance > 0) {
        return "text-blue-600";
      } else {
        return "text-red-600";
      }
    };
  }, []);

  return {
    countFloatSum,
    buildCurrencyPanelState,
    areFloatStacksConfirmed,
    floatAmountIsWithinValidRange,
    sortFloatStacksByValue,
    formatMoney,
    getRepositoryState,
    getFloatState,
    calculateOffBalance,
    styleBalanceResult,
    SESSION_FLOAT_OFF_BALANCE_THRESHOLD,
  };
};
