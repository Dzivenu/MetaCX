// Test script for Float system functionality
// This script can be run to verify the Float system is working correctly

import {
  countFloatSum,
  buildCurrencyPanelState,
  areFloatStacksConfirmed,
  floatAmountIsWithinValidRange,
  formatMoney,
  getRepositoryState,
  getFloatState,
  validateFloatStacks,
  type FloatStack,
  type CurrencyFloat,
} from "@/shared/utils/float-helpers";

// Mock data for testing
const mockFloatStacks: FloatStack[] = [
  {
    id: "fs-1",
    openCount: 100,
    closeCount: 95,
    middayCount: 98,
    lastSessionCount: 102,
    spentDuringSession: "5.0",
    transferredDuringSession: 0,
    denominatedValue: 1.0,
    ticker: "CAD",
    openSpot: 1.0,
    closeSpot: 1.0,
    averageSpot: 1.0,
    openConfirmedDt: new Date(),
    closeConfirmedDt: null,
    value: 1.0,
  },
  {
    id: "fs-2",
    openCount: 50,
    closeCount: 48,
    middayCount: 49,
    lastSessionCount: 51,
    spentDuringSession: "2.0",
    transferredDuringSession: 0,
    denominatedValue: 2.0,
    ticker: "CAD",
    openSpot: 1.0,
    closeSpot: 1.0,
    averageSpot: 1.0,
    openConfirmedDt: new Date(),
    closeConfirmedDt: null,
    value: 2.0,
  },
];

const mockCurrency: CurrencyFloat = {
  id: "curr-1",
  ticker: "CAD",
  name: "Canadian Dollar",
  typeof: "Fiat",
  floatStacks: mockFloatStacks,
};

function runFloatSystemTests() {
  console.log("🧪 Running Float System Tests...\n");

  // Test 1: Float sum calculations
  const openSum = countFloatSum("openCount", mockFloatStacks);
  const closeSum = countFloatSum("closeCount", mockFloatStacks);
  const currentSum = countFloatSum("__CURRENT", mockFloatStacks);

  const panelState = buildCurrencyPanelState(mockCurrency);

  const openConfirmed = areFloatStacksConfirmed("OPEN", mockFloatStacks);
  const closeConfirmed = areFloatStacksConfirmed("CLOSE", mockFloatStacks);

  const isValidBalance = floatAmountIsWithinValidRange(100.0, 100.005);
  const isInvalidBalance = floatAmountIsWithinValidRange(100.0, 101.0);

  const mockRepo = {
    accessLogs: [
      {
        openStartDt: new Date(),
        openConfirmDt: new Date(),
        closeStartDt: null,
        closeConfirmDt: null,
      },
    ],
  };
  const repoState = getRepositoryState(mockRepo);
  const floatState = getFloatState(repoState);

  const validation = validateFloatStacks(mockFloatStacks);
}

// Run tests if this file is executed directly
if (require.main === module) {
  runFloatSystemTests();
}

export { runFloatSystemTests };
