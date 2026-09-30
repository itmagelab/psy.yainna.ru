/** Единое место форматирования чисел и цен — чтобы формат не расходился между секциями. */

const priceFormatter = new Intl.NumberFormat('ru-RU', {
  maximumFractionDigits: 0,
});

/** 2500 → «2 500 ₽» */
export function formatPrice(amount: number): string {
  return `${priceFormatter.format(amount)} ₽`;
}
