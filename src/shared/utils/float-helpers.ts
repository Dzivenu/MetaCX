// Float calculation and validation utilities

export const SESSION_FLOAT_OFF_BALANCE_THRESHOLD = 0.01;

export interface FloatStack {
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

export interface CurrencyFloat {
  id: string;
  ticker: string;
  name: string;
  typeof: string;
  floatStacks: FloatStack[];
}

/**
 * Calculate the sum of float stacks based on type
 */
export function countFloatSum(type: string, floatStacks: FloatStack[]): number {
  let sum = 0;

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
}

/**
 * Build currency panel state with calculated sums
 */
export function buildCurrencyPanelState(currencyObj: CurrencyFloat) {
  const floatStacks = currencyObj.floatStacks;

  return {
    floatSum: 0,
    previousSessionSum: countFloatSum("lastSessionCount", floatStacks),
    openSessionSum: countFloatSum("openCount", floatStacks),
    middaySum: countFloatSum("middayCount", floatStacks),
    closeSessionSum: countFloatSum("closeCount", floatStacks),
    currentSessionSum: countFloatSum("__CURRENT", floatStacks),
  };
}

/**
 * Check if all float stacks are confirmed for a given state
 */
export function areFloatStacksConfirmed(
  floatState: string,
  floatStacks: FloatStack[]
): boolean {
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
}

/**
 * Check if float amount is within valid range
 */
export function floatAmountIsWithinValidRange(
  amountA: number,
  amountB: number
): boolean {
  const a = amountA ?? 0;
  const b = amountB ?? 0;

  const difference = parseFloat(Math.abs(a - b).toPrecision(4));

  return difference <= SESSION_FLOAT_OFF_BALANCE_THRESHOLD;
}

/**
 * Sort float stacks by value (descending)
 */
export function sortFloatStacksByValue(a: FloatStack, b: FloatStack): number {
  if (a.value > b.value) {
    return -1;
  } else if (a.value < b.value) {
    return 1;
  } else {
    return 0;
  }
}

/**
 * Format money with specified decimal places
 */
export function formatMoney(amount: number, decimals: number = 2): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

/**
 * Get repository state based on access logs
 */
export function getRepositoryState(repository: any): string {
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
}

/**
 * Get float state from repository state
 */
export function getFloatState(repositoryState: string): string {
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
}

/**
 * Calculate off balance
 */
export function calculateOffBalance(expected: number, actual: number): number {
  return actual - expected;
}

/**
 * Get CSS class for balance result styling
 */
export function styleBalanceResult(balance: number): string {
  if (Math.abs(balance) <= SESSION_FLOAT_OFF_BALANCE_THRESHOLD) {
    return "text-green-600";
  } else if (balance > 0) {
    return "text-blue-600";
  } else {
    return "text-red-600";
  }
}

/**
 * Process skip float count - sets expected balance as count
 */
export function processSkipFloatCount(
  currencyObj: CurrencyFloat,
  floatState: string
): Partial<FloatStack>[] {
  const floatStacks = currencyObj.floatStacks;

  return floatStacks.map((floatStack) => {
    const expectedBalance =
      floatStack.openConfirmedDt === null
        ? floatStack.lastSessionCount
        : floatStack.openCount -
          parseFloat(String(floatStack.spentDuringSession)) -
          parseFloat(String(floatStack.transferredDuringSession));

    if (floatState === "OPEN") {
      return {
        id: floatStack.id,
        openCount: parseFloat(String(expectedBalance)),
        openConfirmedDt: new Date(),
      };
    } else if (floatState === "CLOSE") {
      return {
        id: floatStack.id,
        closeCount: parseFloat(String(expectedBalance)),
        closeConfirmedDt: new Date(),
      };
    }

    return { id: floatStack.id };
  });
}

/**
 * Validate float stacks data
 */
export function validateFloatStacks(floatStacks: FloatStack[]): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!Array.isArray(floatStacks) || floatStacks.length === 0) {
    errors.push("Float stacks array is required and cannot be empty");
    return { isValid: false, errors };
  }

  floatStacks.forEach((stack, index) => {
    if (!stack.id) {
      errors.push(`Float stack at index ${index} is missing ID`);
    }
    if (typeof stack.value !== "number" || stack.value <= 0) {
      errors.push(`Float stack at index ${index} has invalid value`);
    }
    if (!stack.ticker) {
      errors.push(`Float stack at index ${index} is missing ticker`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate currency input step based on type
 */
export function getCurrencyInputStep(currencyType: string): number {
  return currencyType === "Fiat" ? 0.01 : 0.00000001;
}

/**
 * Get decimal count for currency display
 */
export function getCurrencyDecimalCount(currencyType: string): number {
  return currencyType === "Fiat" ? 2 : 8;
}
