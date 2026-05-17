// Hipergeométrica multivariada para combos de varias cartas en Riftbound.
//
// Generalización del modelo del módulo `hypergeometric.ts`:
//   - El jugador busca k cartas distintas (k = 2 o 3 en la UI).
//   - De cada carta i tiene K_i copias y necesita ver al menos a_i en mano.
//   - Mano inicial de 4, mulligan al fondo, modelo conservador.
//
// Estrategia:
//   1. Condicionamos sobre el reparto de la mano inicial (a_1, ..., a_k) con
//      Σa_i ≤ 4. Cada tupla tiene una probabilidad hipergeométrica multivariada.
//   2. Aplicamos el mulligan: si `4 - Σa_i ≥ m`, devolvemos solo "otras" cartas
//      al fondo y no perdemos copias buscadas. Si no, devolvemos primero las
//      "otras" y luego repartimos las restantes entre las cartas buscadas con
//      un greedy que descarta excesos sobre el umbral antes de dañar la base.
//   3. Después del mulligan, robamos (m + extraDraws) cartas más del pool de
//      tamaño N-4 (las devueltas al fondo se asumen fuera de la ventana).
//   4. Sumamos sobre la cola multivariada del pool fresco para cubrir el déficit
//      d_i = max(0, a_i - kept_i) que reste tras la mano.
//
// El módulo es puro: no importa React, Astro ni utilidades de UI.

import { lnChoose } from './hypergeometric.ts';

export type ComboCard = {
  copies: number;   // K_i: copias en el mazo
  atLeast: number;  // a_i: cuántas necesitas ver en mano
};

export type ComboParams = {
  deckSize: number;        // N
  cards: ReadonlyArray<ComboCard>;
  mulligan: number;        // 0, 1, 2 (acotado defensivamente)
  extraDraws: number;      // ≥ 0; 0 = mano inicial post-mulligan
};

// --- Distribución del forcedBottom entre k cartas -----------------------

// Aplica `forcedBottom` descartes al vector `a` (copias en mano), priorizando
// cartas donde a_i excede el umbral. Si todas están en su umbral, daña la base
// proporcionalmente eligiendo la que más copias tiene (heurística óptima
// parcial; este caso es raro en combos reales donde a_i ≤ 4 y k ≥ 2).
function distributeForcedBottom(
  a: ReadonlyArray<number>,
  thresholds: ReadonlyArray<number>,
  forcedBottom: number,
): number[] {
  const kept = [...a];
  let remaining = forcedBottom;

  // Fase 1: descartar excedente sobre el umbral.
  while (remaining > 0) {
    let bestIdx = -1;
    let bestExcess = 0;
    for (let i = 0; i < kept.length; i++) {
      const excess = kept[i]! - thresholds[i]!;
      if (excess > bestExcess && kept[i]! > 0) {
        bestExcess = excess;
        bestIdx = i;
      }
    }
    if (bestIdx === -1) break;
    kept[bestIdx]! -= 1;
    remaining -= 1;
  }

  // Fase 2: si aún falta, dañar la base (la mano estaba inundada de copias
  // exactamente al umbral y no hay margen). Coge la carta con más kept.
  while (remaining > 0) {
    let bestIdx = -1;
    let bestKept = 0;
    for (let i = 0; i < kept.length; i++) {
      if (kept[i]! > bestKept) {
        bestKept = kept[i]!;
        bestIdx = i;
      }
    }
    if (bestIdx === -1) break;
    kept[bestIdx]! -= 1;
    remaining -= 1;
  }

  return kept;
}

// --- Cola de la hipergeométrica multivariada ---------------------------

// P(X_i ≥ d_i para todo i) cuando se extraen `n` cartas de una población N
// con K_i copias de cada carta y otherInDeck = N - ΣK_i "otras".
//
// Suma sobre el producto cartesiano de valores válidos (x_1, ..., x_k) con
// d_i ≤ x_i ≤ min(K_i, n - Σx_{j<i}) usando exponenciación de logaritmos para
// estabilidad numérica.
function pMultiTail(
  N: number,
  copies: ReadonlyArray<number>,
  thresholds: ReadonlyArray<number>,
  n: number,
): number {
  const k = copies.length;
  const totalK = copies.reduce((s, c) => s + c, 0);
  const otherInDeck = N - totalK;

  if (otherInDeck < 0 || n < 0 || n > N) return 0;
  // Si algún umbral excede la suma máxima posible, la cola es 0.
  for (let i = 0; i < k; i++) {
    if (thresholds[i]! > Math.min(copies[i]!, n)) return 0;
  }

  const lnN = lnChoose(N, n);
  let pTotal = 0;
  const x: number[] = new Array(k).fill(0);

  function recurse(idx: number, sumX: number): void {
    if (idx === k) {
      const otherInDraw = n - sumX;
      if (otherInDraw < 0 || otherInDraw > otherInDeck) return;

      let logP = -lnN;
      for (let i = 0; i < k; i++) {
        logP += lnChoose(copies[i]!, x[i]!);
      }
      logP += lnChoose(otherInDeck, otherInDraw);

      if (!Number.isFinite(logP)) return;
      pTotal += Math.exp(logP);
      return;
    }
    const minX = thresholds[idx]!;
    const maxX = Math.min(copies[idx]!, n - sumX);
    for (let v = minX; v <= maxX; v++) {
      x[idx] = v;
      recurse(idx + 1, sumX + v);
    }
  }

  recurse(0, 0);
  return pTotal;
}

// --- API de alto nivel --------------------------------------------------

// P(robar el combo completo) en la ventana de mulligan + extraDraws.
// Resultado acotado a [0, 1].
export function probCombo(params: ComboParams): number {
  const { deckSize, cards, extraDraws } = params;
  const k = cards.length;

  if (k === 0) return 0;
  // Cualquier carta con a_i > K_i hace el combo imposible.
  for (const c of cards) {
    if (c.atLeast > c.copies) return 0;
    if (c.atLeast < 0 || c.copies < 0) return 0;
  }

  const copiesArr = cards.map((c) => c.copies);
  const atLeastArr = cards.map((c) => c.atLeast);
  const totalCopies = copiesArr.reduce((s, c) => s + c, 0);
  const otherInDeck = deckSize - totalCopies;
  if (otherInDeck < 0) return 0;
  if (deckSize < 4) return 0; // no se puede ni robar mano inicial

  const clampedM = Math.max(0, Math.min(4, Math.floor(params.mulligan)));
  const clampedExtra = Math.max(0, Math.floor(extraDraws));
  const lnNchoose4 = lnChoose(deckSize, 4);

  let pCombo = 0;
  const a: number[] = new Array(k).fill(0);

  function recurseInitial(idx: number, sumA: number): void {
    if (idx === k) {
      const otherInHand = 4 - sumA;
      if (otherInHand < 0 || otherInHand > otherInDeck) return;

      // P(mano inicial = a) por multivariada.
      let logPInit = -lnNchoose4;
      for (let i = 0; i < k; i++) {
        logPInit += lnChoose(copiesArr[i]!, a[i]!);
      }
      logPInit += lnChoose(otherInDeck, otherInHand);
      if (!Number.isFinite(logPInit)) return;
      const pInit = Math.exp(logPInit);
      if (pInit < 1e-300) return;

      // Mulligan: total devuelto al fondo de cartas buscadas.
      const forcedBottom = Math.max(0, clampedM - otherInHand);
      const kept = distributeForcedBottom(a, atLeastArr, forcedBottom);

      // Déficit que debe cubrirse desde el pool fresco.
      const deficit: number[] = [];
      let anyDeficit = false;
      for (let i = 0; i < k; i++) {
        const d = Math.max(0, atLeastArr[i]! - kept[i]!);
        deficit.push(d);
        if (d > 0) anyDeficit = true;
      }

      const freshPoolSize = deckSize - 4;
      const totalDraws = clampedM + clampedExtra;

      if (!anyDeficit) {
        // Mano + kept ya cumplen el combo, no dependemos del pool.
        pCombo += pInit;
        return;
      }
      if (totalDraws === 0 || freshPoolSize <= 0) {
        // Hay déficit y no podemos robar — fallo.
        return;
      }

      // Composición del pool fresco: K_i - a_i de cada carta buscada,
      // (otherInDeck - otherInHand) "otras".
      const freshCopies = copiesArr.map((K, i) => K - a[i]!);
      const effectiveDraws = Math.min(totalDraws, freshPoolSize);

      const pTail = pMultiTail(
        freshPoolSize,
        freshCopies,
        deficit,
        effectiveDraws,
      );
      pCombo += pInit * pTail;
      return;
    }

    const maxA = Math.min(copiesArr[idx]!, 4 - sumA);
    for (let v = 0; v <= maxA; v++) {
      a[idx] = v;
      recurseInitial(idx + 1, sumA + v);
    }
  }

  recurseInitial(0, 0);

  return Math.max(0, Math.min(1, pCombo));
}
