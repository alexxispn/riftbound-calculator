import CardRow, { type ComboCardState } from './CardRow';
import NumberStepper from './NumberStepper';
import SegmentedControl from './SegmentedControl';

type Props = {
  deckSize: number;
  mulligan: number;
  cards: ReadonlyArray<ComboCardState>;
  onDeckSize: (n: number) => void;
  onMulligan: (n: number) => void;
  onUpdateCard: (idx: number, next: ComboCardState) => void;
  onAddCard: () => void;
  onRemoveCard: (idx: number) => void;
};

const MULLIGAN_OPTIONS = [
  { value: 0, label: '0' },
  { value: 1, label: '1' },
  { value: 2, label: '2' },
] as const;

export default function ComboParamForm(props: Props) {
  const sumCopies = props.cards.reduce((s, c) => s + c.copies, 0);
  const canAdd = props.cards.length < 3;
  const canRemove = props.cards.length > 2;

  return (
    <section className="py-10 sm:py-14">
      <p className="mb-10 font-sans text-[0.65rem] font-medium uppercase tracking-[0.28em] text-muted">
        <span className="text-gold">⬢</span>
        <span className="ml-2">Parámetros</span>
      </p>
      <div className="mb-12 grid grid-cols-1 gap-x-12 gap-y-10 sm:grid-cols-2">
        <NumberStepper
          label="Cartas en el mazo"
          value={props.deckSize}
          min={10}
          max={60}
          onChange={props.onDeckSize}
          hint="Cartas robables del mazo. En Riftbound, 39 (el Chosen está aparte)."
        />
        <SegmentedControl<number>
          label="Mulligan"
          value={props.mulligan}
          options={MULLIGAN_OPTIONS}
          onChange={props.onMulligan}
        />
      </div>

      <p className="mb-6 font-sans text-[0.65rem] font-medium uppercase tracking-[0.28em] text-muted">
        <span className="text-gold">⬢</span>
        <span className="ml-2">Cartas del combo</span>
      </p>

      <div className="space-y-5">
        {props.cards.map((card, idx) => {
          const otherSum = sumCopies - card.copies;
          const maxCopies = Math.max(0, props.deckSize - otherSum);
          return (
            <CardRow
              key={card.id}
              index={idx}
              card={card}
              maxCopies={maxCopies}
              onChange={(next) => props.onUpdateCard(idx, next)}
              onRemove={canRemove ? () => props.onRemoveCard(idx) : undefined}
            />
          );
        })}
      </div>

      {canAdd && (
        <button
          type="button"
          onClick={props.onAddCard}
          className="mt-5 block w-full border border-dashed border-line py-4 font-sans text-[0.7rem] font-medium uppercase tracking-[0.28em] text-muted transition-colors hover:border-gold hover:text-gold-bright"
        >
          + Añadir carta
        </button>
      )}
    </section>
  );
}
