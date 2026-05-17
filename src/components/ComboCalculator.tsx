import { useMemo, useState } from 'react';
import { probCombo } from '../lib/hypergeometric-multi';
import type { ComboCardState } from './CardRow';
import ComboParamForm from './ComboParamForm';
import HeroStat from './HeroStat';
import TurnTable, { type TurnRow } from './TurnTable';

const HERO_EXTRA_DRAWS = 1; // T1 en 1v1 estándar — ambos jugadores roban.

// 39 = 40 cartas del deck-build menos 1 Chosen Champion. El Chosen está
// siempre disponible fuera de la pila de robo (P=1), así que el universo
// estocástico real son las 39 cartas robables. Coherente con Individual.
const DEFAULT_DECK_SIZE = 39;
const DEFAULT_COPIES_PER_CARD = 3;

const INITIAL_CARDS: ComboCardState[] = [
  { id: 'combo-card-1', name: '', copies: DEFAULT_COPIES_PER_CARD, atLeast: 1 },
  { id: 'combo-card-2', name: '', copies: DEFAULT_COPIES_PER_CARD, atLeast: 1 },
];

let cardIdCounter = 3;
function generateCardId(): string {
  cardIdCounter += 1;
  return `combo-card-${cardIdCounter}`;
}

export default function ComboCalculator() {
  const [deckSize, setDeckSize] = useState<number>(DEFAULT_DECK_SIZE);
  const [mulligan, setMulligan] = useState<number>(2);
  const [cards, setCards] = useState<ComboCardState[]>(INITIAL_CARDS);

  // Al reducir deckSize, si la suma de copies excede el nuevo deckSize,
  // recortamos desde la última carta hacia atrás. También reajustamos
  // `atLeast` si una copia cae por debajo de su umbral.
  const handleDeckSize = (next: number): void => {
    const sumCopies = cards.reduce((s, c) => s + c.copies, 0);
    if (sumCopies <= next) {
      setDeckSize(next);
      return;
    }
    const adjusted = cards.map((c) => ({ ...c }));
    let excess = sumCopies - next;
    for (let i = adjusted.length - 1; i >= 0 && excess > 0; i--) {
      const reduceBy = Math.min(adjusted[i]!.copies, excess);
      adjusted[i]!.copies -= reduceBy;
      excess -= reduceBy;
      const newCopies = adjusted[i]!.copies;
      if (adjusted[i]!.atLeast > Math.max(1, newCopies)) {
        adjusted[i]!.atLeast = Math.max(1, newCopies);
      }
    }
    setCards(adjusted);
    setDeckSize(next);
  };

  // Clamp recíproco: copies ≤ deckSize - Σ otras copies, y atLeast ∈ [1, copies].
  const updateCard = (idx: number, next: ComboCardState): void => {
    const otherSum = cards.reduce(
      (s, c, i) => (i === idx ? s : s + c.copies),
      0,
    );
    const maxCopies = Math.max(0, deckSize - otherSum);
    const clampedCopies = Math.max(0, Math.min(next.copies, maxCopies));
    const clampedAtLeast = Math.max(
      1,
      Math.min(Math.max(1, next.atLeast), Math.max(1, clampedCopies)),
    );
    const adjusted = cards.map((c) => ({ ...c }));
    adjusted[idx] = {
      ...next,
      copies: clampedCopies,
      atLeast: clampedAtLeast,
    };
    setCards(adjusted);
  };

  const addCard = (): void => {
    if (cards.length >= 3) return;
    setCards([
      ...cards,
      {
        id: generateCardId(),
        name: '',
        copies: Math.min(
          DEFAULT_COPIES_PER_CARD,
          Math.max(0, deckSize - cards.reduce((s, c) => s + c.copies, 0)),
        ),
        atLeast: 1,
      },
    ]);
  };

  const removeCard = (idx: number): void => {
    if (cards.length <= 2) return;
    setCards(cards.filter((_, i) => i !== idx));
  };

  const heroCardsSeen = 4 + mulligan + HERO_EXTRA_DRAWS;

  const comboCardsParam = useMemo(
    () => cards.map((c) => ({ copies: c.copies, atLeast: c.atLeast })),
    [cards],
  );

  const heroProb = useMemo(
    () =>
      probCombo({
        deckSize,
        cards: comboCardsParam,
        mulligan,
        extraDraws: HERO_EXTRA_DRAWS,
      }),
    [deckSize, comboCardsParam, mulligan],
  );

  const turnRows = useMemo<ReadonlyArray<TurnRow>>(() => {
    const rows: TurnRow[] = [];
    for (let t = 1; t <= 9; t++) {
      const extraDraws = t;
      const cardsSeen = 4 + mulligan + extraDraws;
      const prob = probCombo({
        deckSize,
        cards: comboCardsParam,
        mulligan,
        extraDraws,
      });
      rows.push({ turn: t, cardsSeen, prob });
    }
    return rows;
  }, [deckSize, comboCardsParam, mulligan]);

  const heroSubtitle =
    'Buscas: ' +
    cards
      .map((c, i) => `${c.atLeast} ${c.name.trim() || `Carta ${i + 1}`}`)
      .join(' + ');

  return (
    <>
      <div className="animate-rise" style={{ animationDelay: '120ms' }}>
        <HeroStat
          probability={heroProb}
          atLeast={1}
          cardsSeen={heroCardsSeen}
          captionLabel="Combo completo"
          subtitle={heroSubtitle}
        />
      </div>

      <hr />

      <div className="animate-rise" style={{ animationDelay: '220ms' }}>
        <ComboParamForm
          deckSize={deckSize}
          mulligan={mulligan}
          cards={cards}
          onDeckSize={handleDeckSize}
          onMulligan={setMulligan}
          onUpdateCard={updateCard}
          onAddCard={addCard}
          onRemoveCard={removeCard}
        />
      </div>

      <hr />

      <div className="animate-rise" style={{ animationDelay: '320ms' }}>
        <TurnTable rows={turnRows} atLeast={1} />
      </div>

      <hr className="mb-8 sm:mb-10" />

      <footer
        className="animate-rise space-y-3 text-xs leading-relaxed text-muted"
        style={{ animationDelay: '420ms' }}
      >
        <p>
          <strong className="font-medium text-ink/80">Chosen Champion.</strong>{' '}
          Si tu combo incluye al <em>Chosen Champion</em>, no lo añadas como
          carta del combo — el Chosen está siempre disponible (P=1), así que
          el combo real es el resto de cartas robables.
        </p>
        <p>
          <strong className="font-medium text-ink/80">Fórmula.</strong>{' '}
          Distribución hipergeométrica multivariada{' '}
          P(<em>X<sub>i</sub></em> ≥ <em>a<sub>i</sub></em> para todo{' '}
          <em>i</em>). El combo se cumple cuando todas las cartas alcanzan su
          umbral simultáneamente en la ventana de robo.
        </p>
        <p>
          <strong className="font-medium text-ink/80">Supuestos.</strong>{' '}
          El cálculo asume mulligan conservador: nunca devuelves una copia de
          una carta del combo salvo que la mano de 4 esté inundada de copias
          buscadas (caso raro en combos). Modelo coherente con el modo
          Individual.
        </p>
        <p>
          <strong className="font-medium text-ink/80">Reglas.</strong> Formato
          1v1 estándar; ambos jugadores roban una carta en cada turno desde
          T1.
        </p>
      </footer>
    </>
  );
}
