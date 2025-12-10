export function formatCurrency(value: number | string | undefined, digits = 0) {
  const v = Number(value ?? 0) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(v);
}