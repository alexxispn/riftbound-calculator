import { formatPercent, thresholdOf } from '../lib/format';
import ProbabilityBar from './ProbabilityBar';

export type TurnRow = {
  turn: number;
  cardsSeen: number;
  prob: number;
};

type Props = {
  rows: ReadonlyArray<TurnRow>;
  atLeast: number;
};

const textByTier = {
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
} as const;

export default function TurnTable({ rows, atLeast }: Props) {
  return (
    <section className="py-10 sm:py-14">
      <p className="mb-8 font-sans text-[0.65rem] font-medium uppercase tracking-[0.28em] text-muted">
        <span className="text-gold">⬢</span>
        <span className="ml-2">
          Por turno · P(≥&nbsp;{atLeast})
        </span>
      </p>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-line text-[0.6rem] font-medium uppercase tracking-[0.2em] text-muted">
              <th scope="col" className="py-2 pl-1 pr-3 text-left font-medium">
                Turno
              </th>
              <th scope="col" className="px-3 py-2 text-left font-medium">
                Cartas&nbsp;vistas
              </th>
              <th
                scope="col"
                className="hidden px-3 py-2 text-left font-medium sm:table-cell"
              >
                Probabilidad
              </th>
              <th scope="col" className="py-2 pl-3 pr-1 text-right font-medium">
                P(≥&nbsp;{atLeast})
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const tier = thresholdOf(row.prob);
              return (
                <tr
                  key={row.turn}
                  className="border-b border-line/40 transition-colors hover:bg-panel/40"
                >
                  <td className="py-3 pl-1 pr-3 font-mono text-lg font-medium text-ink tabular-nums slashed-zero">
                    T{row.turn}
                  </td>
                  <td className="px-3 py-3 font-mono text-sm tabular-nums slashed-zero text-muted">
                    {row.cardsSeen}
                  </td>
                  <td className="hidden px-3 py-3 sm:table-cell">
                    <ProbabilityBar probability={row.prob} />
                  </td>
                  <td
                    className={`py-3 pl-3 pr-1 text-right font-mono text-lg font-medium tabular-nums slashed-zero ${textByTier[tier]}`}
                  >
                    {formatPercent(row.prob)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
