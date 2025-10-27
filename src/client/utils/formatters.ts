export const formatCurrency = (amount: number, ticker: string): string => {
  return `${ticker} ${amount.toFixed(2)}`;
};

export const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString();
};

export const formatNumber = (value: number, decimals: number = 2): string => {
  return value.toFixed(decimals);
};
