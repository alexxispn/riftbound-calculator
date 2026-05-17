import { formatPercent, thresholdOf } from '../lib/format';

type Props = {
  probability: number;
  atLeast: number;
  cardsSeen: number;
  // Sobrescribe la etiqueta "P(≥X copia)" del pie de la cifra. Útil en modo
  // Combo donde la métrica es "Combo completo" en vez de copias individuales.
  captionLabel?: string;
  // Texto secundario que se renderiza bajo la cifra a ancho completo,
  // típicamente para describir la composición del combo.
  subtitle?: string;
};

const textByTier = {
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
} as const;

export default function HeroStat({
  probability,
  atLeast,
  cardsSeen,
  captionLabel,
  subtitle,
}: Props) {
  const tier = thresholdOf(probability);
  const formatted = formatPercent(probability);
  // Separamos el '%' del número para renderizarlo más pequeño y elegante,
  // como en revistas de datos. El número ocupa todo el peso visual.
  const num = formatted.slice(0, -1);
  const caption =
    captionLabel ??
    `P(≥ ${atLeast} ${atLeast === 1 ? 'copia' : 'copias'})`;
  return (
    <section
      aria-live="polite"
      className="py-10 sm:py-16"
    >
      <div className="grid grid-cols-12 items-end gap-y-6 gap-x-6 sm:gap-x-10">
        {/* Kicker label en columna izquierda. */}
        <div className="col-span-12 sm:col-span-4">
          <p className="font-sans text-[0.65rem] font-medium uppercase tracking-[0.28em] text-muted">
            <span className="text-gold">⬢</span>
            <span className="ml-2">Probabilidad</span>
          </p>
          <p className="mt-3 font-display text-2xl font-normal text-ink/90 sm:text-3xl">
            Inicio de T1
          </p>
        </div>

        {/* Cifra gigante anclada a la derecha. */}
        <div className="col-span-12 sm:col-span-8 sm:text-right">
          <p
            className={`font-mono font-medium leading-[0.85] tabular-nums slashed-zero ${textByTier[tier]}`}
            style={{ fontSize: 'clamp(4.5rem, 16vw, 10.5rem)' }}
          >
            {num}
            <span className="ml-2 align-baseline text-[0.55em] opacity-70">%</span>
          </p>
          <p className="mt-5 font-sans text-[0.7rem] font-medium uppercase tracking-[0.24em] text-muted">
            {caption}
            <span className="mx-2 text-faint">·</span>
            {cardsSeen}&nbsp;cartas&nbsp;vistas
          </p>
        </div>
      </div>

      {subtitle && (
        <p className="mt-6 font-sans text-sm italic text-muted/90 sm:mt-8">
          {subtitle}
        </p>
      )}
    </section>
  );
}
