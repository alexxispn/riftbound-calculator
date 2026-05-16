// Utilidades de formato y categorización para la UI.
// Puras, sin imports de React/Astro/utilidades de UI.

// Formateamos el número como decimal y concatenamos el % manualmente para
// evitar el NBSP que Intl mete entre cifra y signo con style: 'percent'
// (correcto según RAE pero feo a tamaño hero).
const numberFormatter = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function formatPercent(p: number): string {
  return `${numberFormatter.format(p * 100)}%`;
}

export type Threshold = 'success' | 'warning' | 'danger';

export function thresholdOf(p: number): Threshold {
  if (p >= 0.85) return 'success';
  if (p >= 0.6) return 'warning';
  return 'danger';
}
