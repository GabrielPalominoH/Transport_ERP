export const formatCurrency = (amount: number): string => {
  if (isNaN(amount)) {
    return 'S/. 0.00'; // Or some other placeholder for invalid numbers
  }
  return `S/. ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
