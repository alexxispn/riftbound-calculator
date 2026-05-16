import { useMemo, useState } from 'react';
import { probAtLeast } from '../lib/hypergeometric';
import HeroStat from './HeroStat';
import ParamForm from './ParamForm';
import TurnTable, { type TurnRow } from './TurnTable';

const HERO_EXTRA_DRAWS = 1; // T1 en 1v1 estándar — ambos jugadores roban.

export default function Calculator() {
  // 39 = 40 cartas del deck-build menos 1 Chosen Champion, que está siempre
  // disponible y no entra en la pila de robo. Ver nota al pie.
  const [deckSize, setDeckSize] = useState<number>(39);
  const [copies, setCopies] = useState<number>(8);
  const [atLeast, setAtLeast] = useState<number>(1);
  const [mulligan, setMulligan] = useState<number>(2);

  const handleDeckSize = (next: number): void => {
    setDeckSize(next);
    if (copies > next) setCopies(next);
  };

  const heroCardsSeen = 4 + mulligan + HERO_EXTRA_DRAWS;

  const heroProb = useMemo(
    () =>
      probAtLeast({
        deckSize,
        copies,
        mulligan,
        extraDraws: HERO_EXTRA_DRAWS,
        atLeast,
      }),
    [deckSize, copies, mulligan, atLeast],
  );

  const turnRows = useMemo<ReadonlyArray<TurnRow>>(() => {
    const rows: TurnRow[] = [];
    for (let t = 1; t <= 9; t++) {
      const extraDraws = t;
      const cardsSeen = 4 + mulligan + extraDraws;
      const prob = probAtLeast({
        deckSize,
        copies,
        mulligan,
        extraDraws,
        atLeast,
      });
      rows.push({ turn: t, cardsSeen, prob });
    }
    return rows;
  }, [deckSize, copies, mulligan, atLeast]);

  return (
    <main className="mx-auto max-w-5xl px-5 py-10 sm:px-10 sm:py-16">
      <header className="animate-rise" style={{ animationDelay: '0ms' }}>
        <p className="font-sans text-[0.65rem] font-medium uppercase tracking-[0.32em] text-gold-deep">
          Riftbound · 1v1
        </p>
        <h1 className="mt-3 font-display text-3xl font-medium text-ink sm:text-4xl">
          Calculadora de robo
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          Probabilidades hipergeométricas para decisiones de mazo
        </p>
      </header>

      <hr className="mt-8 sm:mt-12" />

      <div className="animate-rise" style={{ animationDelay: '120ms' }}>
        <HeroStat probability={heroProb} atLeast={atLeast} cardsSeen={heroCardsSeen} />
      </div>

      <hr />

      <div className="animate-rise" style={{ animationDelay: '220ms' }}>
        <ParamForm
          deckSize={deckSize}
          copies={copies}
          atLeast={atLeast}
          mulligan={mulligan}
          onDeckSize={handleDeckSize}
          onCopies={setCopies}
          onAtLeast={setAtLeast}
          onMulligan={setMulligan}
        />
      </div>

      <hr />

      <div className="animate-rise" style={{ animationDelay: '320ms' }}>
        <TurnTable rows={turnRows} atLeast={atLeast} />
      </div>

      <hr className="mb-8 sm:mb-10" />

      <footer
        className="animate-rise space-y-3 text-xs leading-relaxed text-muted"
        style={{ animationDelay: '420ms' }}
      >
        <p>
          <strong className="font-medium text-ink/80">Mazo robable.</strong>{' '}
          En Riftbound un mazo principal son 40 cartas, pero 1 de ellas (el{' '}
          <em>Chosen Champion</em>) está siempre disponible para jugar y no
          entra en la pila de robo. Por eso el valor por defecto de{' '}
          <em>Cartas en el mazo</em> es 39 — el universo real sobre el que
          se calcula la probabilidad hipergeométrica.
        </p>
        <p>
          <strong className="font-medium text-ink/80">Fórmula.</strong>{' '}
          Distribución hipergeométrica P(<em>X</em> ≥ k) con corrección por
          mulligan: las copias que se devolverían al fondo se asumen fuera de
          la ventana de robo (modelo conservador estándar).
        </p>
        <p>
          <strong className="font-medium text-ink/80">Supuestos.</strong>{' '}
          Mulligan óptimo (no devuelves copias buscadas salvo mano inundada);
          no se modelan tutores ni efectos de robo adicional.
        </p>
        <p>
          <strong className="font-medium text-ink/80">Reglas.</strong> El
          cálculo asume formato 1v1 estándar, donde ambos jugadores roban una
          carta en cada turno desde T1. La única diferencia entre ir primero y
          segundo es que el segundo jugador canaliza una runa adicional en su
          primer <em>Channel phase</em> (afecta a la economía de runas, no al
          robo).
        </p>
      </footer>
    </main>
  );
}
