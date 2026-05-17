export type Mode = 'individual' | 'combo';

type Props = {
  mode: Mode;
  onChange: (next: Mode) => void;
};

const OPTIONS: ReadonlyArray<{ value: Mode; label: string }> = [
  { value: 'individual', label: 'Individual' },
  { value: 'combo', label: 'Combo' },
];

export default function ModeTabs({ mode, onChange }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Modo de cálculo"
      className="flex gap-0 border-b border-line"
    >
      {OPTIONS.map((opt) => {
        const selected = opt.value === mode;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(opt.value)}
            className={
              'relative px-5 py-3 font-sans text-[0.7rem] font-medium uppercase tracking-[0.28em] transition-colors ' +
              (selected
                ? 'text-gold-bright'
                : 'text-muted hover:text-ink')
            }
          >
            {opt.label}
            {selected && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-3 right-3 h-[2px] bg-gold"
                style={{ bottom: '-1px' }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
