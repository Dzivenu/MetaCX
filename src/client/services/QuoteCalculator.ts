/**
 * QuoteCalculator - TypeScript implementation of quote calculation logic
 * Adapted from the front implementation's CurrencyWidgetLogic.js
 */

export interface Currency {
  ticker: string;
  name: string;
  rate: number;
  buy_margin_max: number;
  sell_margin_max: number;
  we_buy: number;
  we_sell: number;
  typeof: string;
  contract?: string;
  tradeable: boolean;
  display_order?: number;
  base?: boolean;
}

export interface QuoteState {
  currencyA: Currency;
  currencyB: Currency;
  currencyAval: number;
  currencyBval: number;
  spotFx: number;
  rate: number;
  margin: number;
  serviceFee: number;
  networkFee: number;
  lockedRate: boolean;
  lockedMargin: boolean;
  finalRate: number;
  finalRateWithoutFees: number;
  rateWoFees: number;
}

export interface QuoteCalculationResult {
  currencyAval?: number;
  currencyBval?: number;
  rate?: number;
  margin?: number;
  finalRate?: number;
  finalRateWithoutFees?: number;
  rateWoFees?: number;
}

const BASE_CURRENCY_TICKER = "CAD";
const RATE_AND_MARGIN_DECIMAL_PLACES = 8;
const CAL_CONSTANTS = 2; // Service fee constant

/**
 * Helper function to format numbers with default fallback
 */
export const formatNumberWithDefault = (
  value: any,
  defaultValue: number = 0
): number => {
  if (
    value === "" ||
    value === null ||
    value === undefined ||
    isNaN(Number(value))
  ) {
    return defaultValue;
  }
  return Number(value);
};

/**
 * Helper function to format numbers to specific decimal places
 */
export const formatNumberToPlaces = (value: number, places: number): number => {
  return Number(parseFloat(value.toString()).toFixed(places));
};

/**
 * Get decimal places for currency based on type
 */
export const parseCurrencyDecimalsForQuote = (currency: Currency): number => {
  return currency.typeof?.toUpperCase() === "CRYPTOCURRENCY" ? 8 : 2;
};

/**
 * Calculate final rate (includes all fees)
 */
export const calculateFinalRate = (
  inboundTicker: string,
  inboundSum: number,
  outboundSum: number
): number => {
  if (!inboundSum || !outboundSum || inboundSum <= 0 || outboundSum <= 0) {
    return 0;
  }

  if (inboundTicker === BASE_CURRENCY_TICKER) {
    // Selling CAD for Crypto: CAD Amount / Crypto Amount
    return formatNumberToPlaces(
      inboundSum / outboundSum,
      RATE_AND_MARGIN_DECIMAL_PLACES
    );
  } else {
    // Selling Crypto for CAD: CAD Amount / Crypto Amount
    return formatNumberToPlaces(
      outboundSum / inboundSum,
      RATE_AND_MARGIN_DECIMAL_PLACES
    );
  }
};

/**
 * Calculate final rate without fees (excludes all fees)
 */
export const calculateFinalRateWithoutFees = (
  inboundTicker: string,
  inboundSum: number,
  outboundSum: number,
  serviceFee: number = 0,
  networkFee: number = 0
): number => {
  if (!inboundSum || !outboundSum || inboundSum <= 0 || outboundSum <= 0) {
    return 0;
  }

  const totalFees =
    formatNumberWithDefault(serviceFee) + formatNumberWithDefault(networkFee);

  if (inboundTicker === BASE_CURRENCY_TICKER) {
    // Selling CAD for Crypto: (CAD Amount + Fees) / Crypto Amount
    const inboundSumBeforeFees = inboundSum + totalFees;
    return formatNumberToPlaces(
      inboundSumBeforeFees / outboundSum,
      RATE_AND_MARGIN_DECIMAL_PLACES
    );
  } else {
    // Selling Crypto for CAD: (CAD Amount + Fees) / Crypto Amount
    const outboundSumBeforeFees = outboundSum + totalFees;
    return formatNumberToPlaces(
      outboundSumBeforeFees / inboundSum,
      RATE_AND_MARGIN_DECIMAL_PLACES
    );
  }
};

/**
 * Initialize state object for quote calculations
 */
export const getInitStateObj = (
  inboundTicker: string,
  outboundTicker: string,
  inboundAmount: number,
  serviceFee: number,
  currenciesArray: Currency[]
): Partial<QuoteState> => {
  const inboundObj = currenciesArray.find(
    (currency) => currency.ticker === inboundTicker
  );
  const outboundObj = currenciesArray.find(
    (currency) => currency.ticker === outboundTicker
  );

  if (!inboundObj || !outboundObj) {
    throw new Error("Currency not found in currencies array");
  }

  const formattedInboundAmount = formatNumberWithDefault(inboundAmount);
  const formattedServiceFee = formatNumberWithDefault(serviceFee);

  const inboundRate = formatNumberWithDefault(inboundObj.rate);
  const inboundBuyMargin = formatNumberWithDefault(inboundObj.buy_margin_max);
  const outboundRate = formatNumberWithDefault(outboundObj.rate);
  const outboundSellMargin = formatNumberWithDefault(
    outboundObj.sell_margin_max
  );

  // Calculate adjusted rates
  const adjustedBuyRate = formatNumberToPlaces(
    (formattedInboundAmount * (inboundRate * (1 - inboundBuyMargin / 100)) -
      CAL_CONSTANTS +
      CAL_CONSTANTS) /
      formattedInboundAmount,
    RATE_AND_MARGIN_DECIMAL_PLACES
  );

  const adjustedSellRate = formatNumberToPlaces(
    (formattedInboundAmount * (outboundRate / (1 - outboundSellMargin / 100))) /
      formattedInboundAmount,
    RATE_AND_MARGIN_DECIMAL_PLACES
  );

  if (inboundTicker === BASE_CURRENCY_TICKER) {
    return {
      currencyA: inboundObj,
      currencyB: outboundObj,
      spotFx: formatNumberToPlaces(
        outboundObj.rate,
        RATE_AND_MARGIN_DECIMAL_PLACES
      ),
      rate: adjustedSellRate || 0,
      margin:
        100 *
        (1 -
          formatNumberToPlaces(
            outboundObj.rate,
            RATE_AND_MARGIN_DECIMAL_PLACES
          ) /
            adjustedSellRate),
      serviceFee: formattedServiceFee,
      networkFee: 0,
      finalRate: 0,
      finalRateWithoutFees: 0,
    };
  } else if (outboundTicker === BASE_CURRENCY_TICKER) {
    return {
      currencyA: inboundObj,
      currencyB: outboundObj,
      spotFx: formatNumberToPlaces(
        inboundObj.rate,
        RATE_AND_MARGIN_DECIMAL_PLACES
      ),
      rate: adjustedBuyRate,
      margin:
        100 *
        (1 -
          adjustedBuyRate /
            formatNumberToPlaces(
              inboundObj.rate,
              RATE_AND_MARGIN_DECIMAL_PLACES
            )),
      serviceFee: formattedServiceFee,
      networkFee: 0,
      finalRate: 0,
      finalRateWithoutFees: 0,
    };
  }

  return {};
};

/**
 * Calculate quote when inbound amount changes (main calculation logic)
 */
export const calculateQuoteFromInbound = (
  inboundAmount: number,
  state: QuoteState
): QuoteCalculationResult => {
  const {
    currencyA,
    currencyB,
    serviceFee,
    networkFee,
    spotFx,
    lockedRate,
    lockedMargin,
    rate,
    margin,
  } = state;

  const newValueA = formatNumberWithDefault(inboundAmount);
  const totalFees = serviceFee + networkFee;

  if (currencyA.ticker === BASE_CURRENCY_TICKER) {
    // Selling CAD for Crypto
    const currencyDecimals = parseCurrencyDecimalsForQuote(currencyB);
    const adjustedFee = totalFees * (1 / spotFx);
    const we_sell = formatNumberWithDefault(currencyB.we_sell);

    const roundedValueB = formatNumberToPlaces(
      newValueA / we_sell - adjustedFee,
      currencyDecimals
    );

    const finalRate = calculateFinalRate(
      currencyA.ticker,
      newValueA,
      roundedValueB
    );
    const finalRateWithoutFees = calculateFinalRateWithoutFees(
      currencyA.ticker,
      newValueA,
      roundedValueB,
      serviceFee,
      networkFee
    );

    return {
      currencyAval: newValueA,
      currencyBval: roundedValueB,
      rate: lockedRate ? rate : we_sell,
      margin: lockedMargin ? margin : currencyB.sell_margin_max,
      finalRate,
      finalRateWithoutFees,
      rateWoFees: currencyB.we_sell,
    };
  } else {
    // Selling Crypto for CAD
    const currencyDecimals = parseCurrencyDecimalsForQuote(currencyB);
    const currencyABuyMarginMax = formatNumberWithDefault(
      currencyA.buy_margin_max
    );
    const currencyARate = formatNumberWithDefault(currencyA.rate);

    const adjustedBuyRate = formatNumberToPlaces(
      (newValueA * (currencyARate * (1 - currencyABuyMarginMax / 100)) -
        totalFees +
        totalFees) /
        newValueA,
      RATE_AND_MARGIN_DECIMAL_PLACES
    );

    const currencyBval = formatNumberToPlaces(
      newValueA * (currencyARate * (1 - currencyABuyMarginMax / 100)) -
        totalFees,
      currencyDecimals
    );

    const finalRate = calculateFinalRate(
      currencyA.ticker,
      newValueA,
      currencyBval
    );
    const finalRateWithoutFees = calculateFinalRateWithoutFees(
      currencyA.ticker,
      newValueA,
      currencyBval,
      serviceFee,
      networkFee
    );

    return {
      currencyAval: newValueA,
      currencyBval,
      rate: lockedRate ? currencyA.we_buy : adjustedBuyRate,
      margin: formatNumberToPlaces(
        lockedMargin
          ? currencyA.buy_margin_max
          : 100 * (1 - adjustedBuyRate / spotFx),
        RATE_AND_MARGIN_DECIMAL_PLACES
      ),
      finalRate,
      finalRateWithoutFees,
      rateWoFees: currencyA.we_buy,
    };
  }
};

/**
 * Calculate quote when outbound amount changes
 */
export const calculateQuoteFromOutbound = (
  outboundAmount: number,
  state: QuoteState
): QuoteCalculationResult => {
  const {
    currencyA,
    currencyB,
    serviceFee,
    networkFee,
    spotFx,
    lockedRate,
    lockedMargin,
    rate,
    margin,
  } = state;

  const newValueB = formatNumberWithDefault(outboundAmount);
  const totalFees = serviceFee + networkFee;

  if (currencyB.ticker === BASE_CURRENCY_TICKER) {
    // Buying Crypto with CAD
    const currencyDecimals = parseCurrencyDecimalsForQuote(currencyA);
    const currencyABuyMarginMax = formatNumberWithDefault(
      currencyA.buy_margin_max
    );
    const currencyARate = formatNumberWithDefault(currencyA.rate);

    const marginForCalculation = lockedMargin ? margin : currencyABuyMarginMax;
    const adjustedBuyRate = formatNumberToPlaces(
      (newValueB + totalFees) /
        ((newValueB + totalFees) *
          (1 / (currencyARate * (1 - marginForCalculation / 100)))),
      RATE_AND_MARGIN_DECIMAL_PLACES
    );

    const currencyAval = formatNumberToPlaces(
      (newValueB + totalFees) /
        (currencyARate * (1 - marginForCalculation / 100)),
      currencyDecimals
    );

    const finalRate = calculateFinalRate(
      currencyA.ticker,
      currencyAval,
      newValueB
    );
    const finalRateWithoutFees = calculateFinalRateWithoutFees(
      currencyA.ticker,
      currencyAval,
      newValueB,
      serviceFee,
      networkFee
    );

    return {
      currencyAval,
      currencyBval: newValueB,
      rate: lockedRate ? rate : adjustedBuyRate,
      margin: formatNumberToPlaces(
        lockedMargin ? margin : 100 * (1 - adjustedBuyRate / spotFx),
        RATE_AND_MARGIN_DECIMAL_PLACES
      ),
      finalRate,
      finalRateWithoutFees,
      rateWoFees: currencyA.we_buy,
    };
  } else {
    // Selling CAD for Crypto (reverse calculation)
    const currencyDecimals = parseCurrencyDecimalsForQuote(currencyA);
    const adjustedFee = totalFees * (1 / spotFx);
    const we_sell = formatNumberWithDefault(currencyB.we_sell);

    const roundedValueA = formatNumberToPlaces(
      (newValueB + adjustedFee) * we_sell,
      currencyDecimals
    );

    const finalRate = calculateFinalRate(
      currencyA.ticker,
      roundedValueA,
      newValueB
    );
    const finalRateWithoutFees = calculateFinalRateWithoutFees(
      currencyA.ticker,
      roundedValueA,
      newValueB,
      serviceFee,
      networkFee
    );

    return {
      currencyAval: roundedValueA,
      currencyBval: newValueB,
      rate: lockedRate ? rate : we_sell,
      margin: lockedMargin ? margin : currencyB.sell_margin_max,
      finalRate,
      finalRateWithoutFees,
      rateWoFees: currencyB.we_sell,
    };
  }
};

/**
 * Handle currency swap logic
 */
export const handleCurrencySwap = (
  state: QuoteState,
  currenciesArray: Currency[]
): Partial<QuoteState> => {
  const { currencyA, currencyB, currencyAval, currencyBval } = state;

  if (currencyB.ticker === BASE_CURRENCY_TICKER) {
    // Input B was base currency
    return {
      currencyA: currencyB,
      currencyB: currencyA,
      currencyAval: currencyBval,
      currencyBval: currencyAval,
    };
  } else {
    // Input A was base currency
    return {
      currencyA: currencyB,
      currencyB: currencyA,
      currencyAval: currencyBval,
      currencyBval: currencyAval,
    };
  }
};

/**
 * Get default currencies (base currency + first available)
 */
export const getDefaultCurrencies = (
  currencies: Currency[]
): { inbound: Currency; outbound: Currency } => {
  const baseCurrency = currencies.find(
    (c) => c.ticker === BASE_CURRENCY_TICKER || c.base === true
  );
  const firstNonBaseCurrency = currencies.find(
    (c) => c.ticker !== BASE_CURRENCY_TICKER && c.base !== true
  );

  if (!baseCurrency) {
    throw new Error("Base currency not found");
  }

  return {
    inbound: baseCurrency,
    outbound: firstNonBaseCurrency || currencies[0],
  };
};

/**
 * Main QuoteCalculator class
 */
export class QuoteCalculator {
  private state: QuoteState;
  private currencies: Currency[];

  constructor(currencies: Currency[], serviceFee: number = 2) {
    this.currencies = currencies;
    const { inbound, outbound } = getDefaultCurrencies(currencies);

    const initState = getInitStateObj(
      inbound.ticker,
      outbound.ticker,
      0,
      serviceFee,
      currencies
    );

    this.state = {
      currencyA: inbound,
      currencyB: outbound,
      currencyAval: 0,
      currencyBval: 0,
      spotFx: 0,
      rate: 0,
      margin: 0,
      serviceFee,
      networkFee: 0,
      lockedRate: false,
      lockedMargin: false,
      finalRate: 0,
      finalRateWithoutFees: 0,
      rateWoFees: 0,
      ...initState,
    };
  }

  /**
   * Update inbound amount and recalculate
   */
  updateInboundAmount(amount: number): QuoteCalculationResult {
    const result = calculateQuoteFromInbound(amount, this.state);
    this.state = { ...this.state, ...result };
    return result;
  }

  /**
   * Update outbound amount and recalculate
   */
  updateOutboundAmount(amount: number): QuoteCalculationResult {
    const result = calculateQuoteFromOutbound(amount, this.state);
    this.state = { ...this.state, ...result };
    return result;
  }

  /**
   * Change inbound currency
   */
  changeInboundCurrency(ticker: string): QuoteCalculationResult {
    const currency = this.currencies.find((c) => c.ticker === ticker);
    if (!currency) {
      throw new Error(`Currency ${ticker} not found`);
    }

    // Recalculate state with new currency
    const initState = getInitStateObj(
      ticker,
      this.state.currencyB.ticker,
      this.state.currencyAval,
      this.state.serviceFee,
      this.currencies
    );

    this.state = {
      ...this.state,
      currencyA: currency,
      ...initState,
    };

    // Recalculate with current inbound amount
    if (this.state.currencyAval > 0) {
      return this.updateInboundAmount(this.state.currencyAval);
    }

    return this.state;
  }

  /**
   * Change outbound currency
   */
  changeOutboundCurrency(ticker: string): QuoteCalculationResult {
    const currency = this.currencies.find((c) => c.ticker === ticker);
    if (!currency) {
      throw new Error(`Currency ${ticker} not found`);
    }

    // Recalculate state with new currency
    const initState = getInitStateObj(
      this.state.currencyA.ticker,
      ticker,
      this.state.currencyAval,
      this.state.serviceFee,
      this.currencies
    );

    this.state = {
      ...this.state,
      currencyB: currency,
      ...initState,
    };

    // Recalculate with current inbound amount
    if (this.state.currencyAval > 0) {
      return this.updateInboundAmount(this.state.currencyAval);
    }

    return this.state;
  }

  /**
   * Swap currencies
   */
  swapCurrencies(): QuoteCalculationResult {
    const swapResult = handleCurrencySwap(this.state, this.currencies);

    // Recalculate rates for swapped currencies
    const newInboundTicker =
      swapResult.currencyA?.ticker || this.state.currencyA.ticker;
    const newOutboundTicker =
      swapResult.currencyB?.ticker || this.state.currencyB.ticker;

    const initState = getInitStateObj(
      newInboundTicker,
      newOutboundTicker,
      swapResult.currencyAval || 0,
      this.state.serviceFee,
      this.currencies
    );

    this.state = {
      ...this.state,
      ...swapResult,
      ...initState,
    };

    // Recalculate with swapped inbound amount
    if (this.state.currencyAval > 0) {
      return this.updateInboundAmount(this.state.currencyAval);
    }

    return this.state;
  }

  /**
   * Get current state
   */
  getState(): QuoteState {
    return { ...this.state };
  }

  /**
   * Update service fee
   */
  updateServiceFee(fee: number): QuoteCalculationResult {
    this.state.serviceFee = fee;

    // Recalculate with current inbound amount
    if (this.state.currencyAval > 0) {
      return this.updateInboundAmount(this.state.currencyAval);
    }

    return this.state;
  }

  /**
   * Update network fee
   */
  updateNetworkFee(fee: number): QuoteCalculationResult {
    this.state.networkFee = fee;

    // Recalculate with current inbound amount
    if (this.state.currencyAval > 0) {
      return this.updateInboundAmount(this.state.currencyAval);
    }

    return this.state;
  }

  /**
   * Update margin
   */
  updateMargin(margin: number): QuoteCalculationResult {
    this.state.margin = margin;
    this.state.lockedMargin = true; // Lock margin when manually set

    // Recalculate with current inbound amount
    if (this.state.currencyAval > 0) {
      return this.updateInboundAmount(this.state.currencyAval);
    }

    return this.state;
  }

  /**
   * Update final rate
   */
  updateFinalRate(rate: number): QuoteCalculationResult {
    this.state.finalRate = rate;
    this.state.rate = rate;
    this.state.lockedRate = true; // Lock rate when manually set

    // When rate is manually set, recalculate outbound amount based on new rate
    if (this.state.currencyAval > 0) {
      const { currencyA, currencyB } = this.state;

      if (currencyA.ticker === BASE_CURRENCY_TICKER) {
        // Selling CAD for Crypto: outbound = inbound / rate
        const currencyDecimals = parseCurrencyDecimalsForQuote(currencyB);
        const newOutboundAmount = formatNumberToPlaces(
          this.state.currencyAval / rate,
          currencyDecimals
        );

        this.state.currencyBval = newOutboundAmount;
      } else {
        // Selling Crypto for CAD: outbound = inbound * rate
        const currencyDecimals = parseCurrencyDecimalsForQuote(currencyB);
        const newOutboundAmount = formatNumberToPlaces(
          this.state.currencyAval * rate,
          currencyDecimals
        );

        this.state.currencyBval = newOutboundAmount;
      }

      return {
        currencyAval: this.state.currencyAval,
        currencyBval: this.state.currencyBval,
        rate: this.state.rate,
        finalRate: this.state.finalRate,
        margin: this.state.margin,
      };
    }

    return this.state;
  }

  /**
   * Reset locked states to allow automatic recalculation
   */
  resetLocks(): QuoteCalculationResult {
    this.state.lockedRate = false;
    this.state.lockedMargin = false;

    // Recalculate with current inbound amount
    if (this.state.currencyAval > 0) {
      return this.updateInboundAmount(this.state.currencyAval);
    }

    return this.state;
  }
}
