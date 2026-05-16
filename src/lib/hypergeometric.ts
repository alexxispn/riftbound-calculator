// Probabilidades hipergeométricas para Riftbound.
//
// Modelo: mazo de N cartas con K copias buscadas. El jugador roba una mano de 4,
// puede mulligar hasta `m` cartas que van al FONDO del mazo y son reemplazadas
// del top, y después roba `extraDraws` cartas en sus turnos. Calculamos la
// probabilidad de haber visto al menos `atLeast` copias al final de esa ventana.
//
// Asumimos mulligan óptimo (solo se devuelven copias buscadas si la mano está
// inundada de ellas) y tratamos las cartas devueltas al fondo como fuera de la
// ventana de robo temprana. Es el modelo competitivo estándar, ligeramente
// conservador.
//
// El módulo es puro: no importa React, Astro ni utilidades de UI.

// --- Lanczos lgamma -----------------------------------------------------

// Aproximación de Lanczos para ln Γ(z) con g=7 y 9 coeficientes.
// Numéricamente estable para los factoriales de hasta ~60 que necesitamos en
// los coeficientes binomiales de un mazo de Riftbound (los valores directos
// desbordarían un double mucho antes que el espacio logarítmico).
const LANCZOS_G = 7;
const LANCZOS_COEF: readonly number[] = [
  0.99999999999980993,
  676.5203681218851,
  -1259.1392167224028,
  771.32342877765313,
  -176.61502916214059,
  12.507343278686905,
  -0.13857109526572012,
  9.9843695780195716e-6,
  1.5056327351493116e-7,
];

const LN_SQRT_2PI = 0.91893853320467274178; // 0.5 * ln(2π)

export function lgamma(z: number): number {
  // Solo soportamos z > 0 — todos nuestros argumentos son factoriales (n+1).
  const x = z - 1;
  let a = LANCZOS_COEF[0]!;
  for (let i = 1; i < LANCZOS_COEF.length; i++) {
    a += LANCZOS_COEF[i]! / (x + i);
  }
  const t = x + LANCZOS_G + 0.5;
  return LN_SQRT_2PI + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

// --- Coeficiente binomial en log-space ----------------------------------

export function lnChoose(n: number, k: number): number {
  if (k < 0 || n < 0 || k > n) return -Infinity;
  return lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1);
}

// --- Hipergeométrica PMF ------------------------------------------------

// P(X = i) cuando muestreas `sample` cartas sin reemplazo de una población
// `pop` que contiene `succ` éxitos. Calculado en log-space y exponenciado al
// final para evitar overflow/underflow.
export function hyperPMF(
  i: number,
  pop: number,
  succ: number,
  sample: number,
): number {
  if (i < 0) return 0;
  if (i > succ || i > sample) return 0;
  if (sample - i > pop - succ) return 0;
  const logP =
    lnChoose(succ, i) +
    lnChoose(pop - succ, sample - i) -
    lnChoose(pop, sample);
  return Math.exp(logP);
}

// --- Distribución de copias vistas con mulligan -------------------------

// Devuelve { j: P(haber visto j copias) } modelando:
//   1. Mano inicial de 4 cartas.
//   2. Hasta `m` cartas devueltas al fondo y reemplazadas (mulligan óptimo:
//      bottom-amos primero las no-buscadas; solo bottom-amos copias buscadas
//      cuando la mano se inunda y `m` excede a las no-buscadas en mano).
//   3. `extraDraws` robos posteriores desde el top (los reemplazos del
//      mulligan también salen del top, así que cuentan como draws del pool).
//
// Las cartas devueltas al fondo se asumen fuera de la ventana de robo.
export function seenDistribution(
  N: number,
  K: number,
  m: number,
  extraDraws: number,
): Map<number, number> {
  const clampedM = Math.max(0, Math.min(4, Math.floor(m)));
  const clampedK = Math.max(0, Math.min(N, Math.floor(K)));
  const dist = new Map<number, number>();
  const handMax = Math.min(clampedK, 4);

  for (let a = 0; a <= handMax; a++) {
    const pA = hyperPMF(a, N, clampedK, 4);
    if (pA === 0) continue;

    const forcedBottom = Math.max(0, clampedM - (4 - a));
    // Algebraicamente forcedBottom ≤ a siempre cuando m ∈ [0,4] y a ∈ [0,4]:
    // forcedBottom ≤ a ⇔ m − (4−a) ≤ a ⇔ m ≤ 4. Mantenemos el max(0, …) como
    // defensa por si el clamp inicial sobre m cambiase en el futuro y dejase
    // pasar valores mayores que 4.
    const keptInHand = Math.max(0, a - forcedBottom);

    const pool = N - 4;
    const poolWanted = clampedK - a;
    const draws = clampedM + extraDraws;

    // C(pool, draws) explota a −∞ en log-space cuando draws > pool, lo que
    // propagaría NaN al exponenciar. Físicamente, si pides más cartas de las
    // que quedan en el mazo, simplemente ves todas las que quedan.
    const effectiveDraws = Math.min(Math.max(0, draws), Math.max(0, pool));
    const cap = Math.min(poolWanted, effectiveDraws);

    for (let b = 0; b <= cap; b++) {
      const pB = hyperPMF(b, pool, poolWanted, effectiveDraws);
      const bucket = keptInHand + b;
      dist.set(bucket, (dist.get(bucket) ?? 0) + pA * pB);
    }
  }

  return dist;
}

// --- API de alto nivel --------------------------------------------------

export type DrawParams = {
  deckSize: number;
  copies: number;
  mulligan: number;
  extraDraws: number;
  atLeast: number;
};

// P(haber visto ≥ atLeast copias) bajo los parámetros dados.
// Resultado acotado a [0, 1].
export function probAtLeast(params: DrawParams): number {
  const { deckSize, copies, mulligan, extraDraws, atLeast } = params;
  if (atLeast <= 0) return 1;
  const dist = seenDistribution(deckSize, copies, mulligan, extraDraws);
  let p = 0;
  for (const [j, pj] of dist) {
    if (j >= atLeast) p += pj;
  }
  return Math.max(0, Math.min(1, p));
}
