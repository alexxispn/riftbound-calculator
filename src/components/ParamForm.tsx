import NumberStepper from './NumberStepper';
import SegmentedControl from './SegmentedControl';

type Props = {
  deckSize: number;
  copies: number;
  atLeast: number;
  mulligan: number;
  onDeckSize: (n: number) => void;
  onCopies: (n: number) => void;
  onAtLeast: (n: number) => void;
  onMulligan: (n: number) => void;
};

const MULLIGAN_OPTIONS = [
  { value: 0, label: '0' },
  { value: 1, label: '1' },
  { value: 2, label: '2' },
] as const;

export default function ParamForm(props: Props) {
  return (
    <section className="py-10 sm:py-14">
      <p className="mb-10 font-sans text-[0.65rem] font-medium uppercase tracking-[0.28em] text-muted">
        <span className="text-gold">⬢</span>
        <span className="ml-2">Parámetros</span>
      </p>
      <div className="grid grid-cols-1 gap-x-12 gap-y-10 sm:grid-cols-2">
        <NumberStepper
          label="Cartas en el mazo"
          value={props.deckSize}
          min={10}
          max={60}
          onChange={props.onDeckSize}
          hint="Cartas robables del mazo. En Riftbound, 39 (el Chosen está aparte)."
        />
        <NumberStepper
          label="Copias en el mazo"
          value={props.copies}
          min={0}
          max={props.deckSize}
          onChange={props.onCopies}
          hint="Ej. nº de unidades de coste 2"
        />
        <NumberStepper
          label="Quiero al menos…"
          value={props.atLeast}
          min={1}
          max={9}
          onChange={props.onAtLeast}
          hint="Copias deseadas en mano"
        />
        <SegmentedControl<number>
          label="Mulligan"
          value={props.mulligan}
          options={MULLIGAN_OPTIONS}
          onChange={props.onMulligan}
        />
      </div>
    </section>
  );
}
