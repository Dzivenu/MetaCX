import { useMemo } from "react";
import { useCurrencies } from "@/client/hooks/useCurrenciesConvex";

// Helper to format number to fixed decimal precision and return string
function formatNumberToDecimalPrecision({
  number,
  precision,
}: {
  number: number;
  precision: number;
}): string {
  if (number === undefined || number === null || Number.isNaN(number))
    return "0";
  const p = typeof precision === "number" && precision >= 0 ? precision : 2;
  try {
    return Number(number).toFixed(p);
  } catch {
    return "0";
  }
}

// Sort helpers based on currency.floatDisplayOrder
function sortTickersByDisplayOrder(
  currencies: Array<{ ticker: string; floatDisplayOrder?: number }>,
  tickers: string[]
): string[] {
  if (!Array.isArray(tickers) || !Array.isArray(currencies))
    return tickers || [];
  const orderMap = new Map(
    currencies.map((c) => [c.ticker, c.floatDisplayOrder ?? 0] as const)
  );
  return [...tickers].sort((a, b) => {
    const ao = orderMap.get(a);
    const bo = orderMap.get(b);
    if (ao == null && bo == null) return 0;
    if (ao == null) return 1;
    if (bo == null) return -1;
    return ao - bo;
  });
}

function sortObjectsByTickerDisplayOrder<T extends Record<string, any>>(
  currencies: Array<{ ticker: string; floatDisplayOrder?: number }>,
  records: T[] = [],
  key: keyof T
): T[] {
  if (!Array.isArray(records) || !Array.isArray(currencies))
    return records || [];
  const orderMap = new Map(
    currencies.map((c) => [c.ticker, c.floatDisplayOrder ?? 0] as const)
  );
  return [...records].sort((a, b) => {
    const at = a?.[key] as unknown as string | undefined;
    const bt = b?.[key] as unknown as string | undefined;
    const ao = at ? orderMap.get(at) : undefined;
    const bo = bt ? orderMap.get(bt) : undefined;
    if (ao == null && bo == null) return 0;
    if (ao == null) return 1;
    if (bo == null) return -1;
    return ao - bo;
  });
}

// Hooks
export const useCurrencyTickerDisplayOrderSort = (tickers?: string[]) => {
  const { currencies } = useCurrencies();
  const sortedTickers = useMemo(
    () => sortTickersByDisplayOrder(currencies || [], tickers || []),
    [currencies, tickers]
  );
  return sortedTickers;
};

export const useCurrencyTickerDisplayOrderSortForObjectArray = <
  T extends Record<string, any>,
>(
  arrayObject: T[] | undefined,
  key: keyof T
) => {
  const { currencies } = useCurrencies();
  const sortedArray = useMemo(
    () =>
      sortObjectsByTickerDisplayOrder(currencies || [], arrayObject || [], key),
    [currencies, arrayObject, key]
  );
  return sortedArray;
};

export const useConfigDataSortedDisplayOrderCurrencies = () => {
  const { currencies } = useCurrencies();
  const sortedCurrencies = useMemo(
    () =>
      currencies
        ? [...currencies].sort(
            (a, b) => (a.floatDisplayOrder ?? 0) - (b.floatDisplayOrder ?? 0)
          )
        : [],
    [currencies]
  );
  return sortedCurrencies;
};

export const useCurrencyRateAndAmountFormatter = () => {
  const { currencies } = useCurrencies();

  const getCurrencyByTicker = (ticker?: string) =>
    ticker ? currencies.find((c) => c.ticker === ticker) : undefined;

  const formatCurrencyAmount = ({
    ticker,
    amount,
  }: {
    ticker?: string;
    amount: number | null | undefined;
  }) => {
    if (!ticker || amount === undefined || amount === null) return "0";
    const target = getCurrencyByTicker(ticker);
    if (!target) return String(amount);

    const precisionInit = Number(target.amountDecimalPlaces);
    const precision = Number.isFinite(precisionInit) ? precisionInit : 2;
    return formatNumberToDecimalPrecision({
      number: Number(amount),
      precision,
    });
  };

  const formatCurrencyRate = ({
    ticker,
    rate,
  }: {
    ticker?: string;
    rate: number | null | undefined;
  }) => {
    if (!ticker || rate === undefined || rate === null) return "0";
    const target = getCurrencyByTicker(ticker);
    if (!target) return String(rate);

    const precisionInit = Number(target.rateDecimalPlaces);
    const precision = Number.isFinite(precisionInit) ? precisionInit : 6;

    return formatNumberToDecimalPrecision({ number: Number(rate), precision });
  };

  return {
    formatCurrencyAmount,
    formatCurrencyRate,
  };
};
