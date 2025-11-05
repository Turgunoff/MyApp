export type Currency = 'UZS' | 'USD' | 'RUB';

export function formatCurrency(amount: number, currency: Currency = 'UZS'): string {
  const formatted = Math.abs(amount).toLocaleString('uz-UZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  const sign = amount < 0 ? '-' : '';
  const symbol = currency === 'UZS' ? "so'm" : currency;

  return `${sign}${formatted} ${symbol}`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('uz-UZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('uz-UZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

