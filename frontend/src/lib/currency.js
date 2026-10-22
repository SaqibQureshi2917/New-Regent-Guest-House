const pkrFormatter = new Intl.NumberFormat('en-PK', {
  style: 'currency',
  currency: 'PKR',
  maximumFractionDigits: 0
});

export const formatCurrency = (amount) => pkrFormatter.format(Number(amount) || 0);
