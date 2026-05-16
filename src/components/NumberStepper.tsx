type Props = {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
  hint?: string;
};

export default function NumberStepper({ label, value, min, max, onChange, hint }: Props) {
  const clamp = (n: number): number => Math.max(min, Math.min(max, n));
  const id = `stepper-${label.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}`;

  return (
    <div className="group">
      <label
        htmlFor={id}
        className="block font-sans text-[0.65rem] font-medium uppercase tracking-[0.22em] text-muted"
      >
        {label}
      </label>
      <div className="mt-3 flex items-center gap-3 border-b border-line pb-2 pt-1 transition-colors group-focus-within:border-gold group-hover:border-faint">
        <button
          type="button"
          onClick={() => onChange(clamp(value - 1))}
          disabled={value <= min}
          aria-label={`Disminuir ${label}`}
          className="grid h-8 w-8 place-items-center rounded-full border border-line text-gold transition-all hover:border-gold hover:bg-gold/10 hover:text-gold-bright active:scale-95 disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:border-line disabled:hover:bg-transparent disabled:hover:text-gold"
        >
          <span className="font-mono text-xl leading-none">−</span>
        </button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          value={value}
          min={min}
          max={max}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            if (Number.isFinite(n)) onChange(clamp(n));
          }}
          className="flex-1 bg-transparent text-center font-mono text-3xl font-medium text-ink tabular-nums slashed-zero outline-none [appearance:textfield] sm:text-4xl"
        />
        <button
          type="button"
          onClick={() => onChange(clamp(value + 1))}
          disabled={value >= max}
          aria-label={`Aumentar ${label}`}
          className="grid h-8 w-8 place-items-center rounded-full border border-line text-gold transition-all hover:border-gold hover:bg-gold/10 hover:text-gold-bright active:scale-95 disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:border-line disabled:hover:bg-transparent disabled:hover:text-gold"
        >
          <span className="font-mono text-xl leading-none">+</span>
        </button>
      </div>
      {hint && (
        <p className="mt-2 font-sans text-[0.7rem] italic text-muted/80">
          {hint}
        </p>
      )}
    </div>
  );
}
