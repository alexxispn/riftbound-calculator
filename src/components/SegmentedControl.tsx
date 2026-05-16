type Option<T extends string | number> = {
  value: T;
  label: string;
};

type Props<T extends string | number> = {
  label: string;
  value: T;
  options: ReadonlyArray<Option<T>>;
  onChange: (next: T) => void;
};

export default function SegmentedControl<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: Props<T>) {
  const labelId = `seg-${label.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}`;

  return (
    <div>
      <span
        id={labelId}
        className="block font-sans text-[0.65rem] font-medium uppercase tracking-[0.22em] text-muted"
      >
        {label}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        className="mt-3 flex gap-1 border-b border-line pb-2 pt-1"
      >
        {options.map((opt) => {
          const selected = opt.value === value;
          return (
            <button
              key={String(opt.value)}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(opt.value)}
              className={
                'relative flex-1 py-1.5 font-mono text-3xl font-medium tabular-nums slashed-zero transition-colors sm:text-4xl ' +
                (selected
                  ? 'text-gold-bright'
                  : 'text-muted hover:text-ink')
              }
            >
              {opt.label}
              {selected && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-1/2 h-[2px] w-8 -translate-x-1/2 bg-gold"
                  style={{ bottom: '-9px' }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
