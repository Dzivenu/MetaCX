export const formatCurrency = (amount: number, ticker: string): string => {
  const numAmount = typeof amount === 'number' ? amount : parseFloat(amount as any) || 0;
  return `${ticker} ${numAmount.toFixed(2)}`;
};

export const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString();
};

export const formatNumber = (value: number, decimals: number = 2): string => {
  return value.toFixed(decimals);
};
