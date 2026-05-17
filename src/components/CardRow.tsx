import NumberStepper from './NumberStepper';

export type ComboCardState = {
  id: string;
  name: string;
  copies: number;
  atLeast: number;
};

type Props = {
  index: number;
  card: ComboCardState;
  onChange: (next: ComboCardState) => void;
  onRemove?: () => void;
  maxCopies: number;
};

export default function CardRow({
  index,
  card,
  onChange,
  onRemove,
  maxCopies,
}: Props) {
  const displayName = card.name.trim() || `Carta ${index + 1}`;
  const nameInputId = `card-name-${card.id}`;

  return (
    <div className="relative border border-line/60 bg-panel/30 p-5 transition-colors hover:border-line sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <p className="font-sans text-[0.65rem] font-medium uppercase tracking-[0.28em] text-muted">
          <span className="text-gold">⬢</span>
          <span className="ml-2">{displayName}</span>
        </p>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Eliminar ${displayName}`}
            className="grid h-7 w-7 place-items-center rounded-full border border-line text-muted transition-all hover:border-danger hover:bg-danger/10 hover:text-danger active:scale-95"
          >
            <span className="font-mono text-base leading-none">×</span>
          </button>
        )}
      </div>

      <div className="mb-6">
        <label
          htmlFor={nameInputId}
          className="block font-sans text-[0.65rem] font-medium uppercase tracking-[0.22em] text-muted"
        >
          Nombre (opcional)
        </label>
        <input
          id={nameInputId}
          type="text"
          value={card.name}
          onChange={(e) => onChange({ ...card, name: e.target.value })}
          placeholder={`Carta ${index + 1}`}
          maxLength={40}
          className="mt-3 w-full border-b border-line bg-transparent pb-2 pt-1 font-sans text-base text-ink placeholder-faint outline-none transition-colors focus:border-gold"
        />
      </div>

      <div className="grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2">
        <NumberStepper
          label="Copias en el mazo"
          value={card.copies}
          min={0}
          max={maxCopies}
          onChange={(n) => onChange({ ...card, copies: n })}
        />
        <NumberStepper
          label="Quiero al menos"
          value={card.atLeast}
          min={1}
          max={Math.max(1, card.copies)}
          onChange={(n) => onChange({ ...card, atLeast: n })}
        />
      </div>
    </div>
  );
}
