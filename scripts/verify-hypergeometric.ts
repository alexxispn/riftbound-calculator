// Verificación del motor matemático.
//
// Uso:
//   node --experimental-strip-types scripts/verify-hypergeometric.ts
//
// Casos univariados (hypergeometric.ts):
//   1. Precisión sobre el caso canónico del spec (40/8/0/0/1 → ≈ 0.60652).
//   2. Direccionalidad del mulligan: mulligar 2 nunca debe bajar P(≥1).
//   3. Edge case con draws > pool (10/4/2/9/1): el clamp evita NaN y, dado
//      que ves el mazo entero, P(≥1) = 1 exactamente.
//   4. T1 en 1v1 estándar (40/8/2/1/1 → ≈ 0.819). Ambos jugadores roban una
//      carta en T1, así que esta probabilidad es la primera fila de la tabla
//      independientemente del orden de turno.
//
// Casos multivariados (hypergeometric-multi.ts):
//   5. Combo de 2 cartas, sin mulligan, mano inicial. Comprobado contra
//      inclusión-exclusión cerrada: 5676/91390 ≈ 0.062109.
//   6. Combo de 3 cartas, sin mulligan, mano inicial. Comprobado contra
//      inclusión-exclusión cerrada: 2080/91390 ≈ 0.022760.
//   7. Caso degenerado: atLeast > copies para alguna carta → 0 exacto.
//   8. Monotonicidad del mulligan sobre combo: m=2 nunca peor que m=0.

import { probAtLeast } from '../src/lib/hypergeometric.ts';
import { probCombo } from '../src/lib/hypergeometric-multi.ts';

let failed = 0;

function check(label: string, ok: boolean, detail: string): void {
  const tag = ok ? 'OK  ' : 'FAIL';
  // biome-ignore lint: script CLI, console intencional.
  console.log(`[${tag}] ${label} — ${detail}`);
  if (!ok) failed++;
}

// Caso 1: precisión sobre el caso canónico del spec.
// Cierre cerrado: 1 - C(32,4)/C(40,4) = 1 - 35960/91390 = 0.60652...
const p1 = probAtLeast({
  deckSize: 40,
  copies: 8,
  mulligan: 0,
  extraDraws: 0,
  atLeast: 1,
});
check(
  'caso 1 · 40/8/0/0/1',
  Math.abs(p1 - 0.60652) < 1e-4,
  `obtenido ${p1.toFixed(6)}, esperado ≈ 0.60652`,
);

// Caso 2: direccionalidad del mulligan. Con K=8 y atLeast=1, mulligar 2
// cartas no buscadas no debería bajar la probabilidad nunca.
const p2m0 = probAtLeast({
  deckSize: 40,
  copies: 8,
  mulligan: 0,
  extraDraws: 0,
  atLeast: 1,
});
const p2m2 = probAtLeast({
  deckSize: 40,
  copies: 8,
  mulligan: 2,
  extraDraws: 0,
  atLeast: 1,
});
check(
  'caso 2 · mulligan ↑ ⇒ P(≥1) ↑',
  p2m2 >= p2m0 - 1e-12,
  `m=0 → ${p2m0.toFixed(6)}, m=2 → ${p2m2.toFixed(6)}`,
);

// Caso 3: edge case con draws > pool. N=10, m=2, extraDraws=9 → draws=11
// pero pool = N-4 = 6. Sin el clamp en seenDistribution, hyperPMF explota.
// Con K=4 copias y viendo el mazo entero, P(≥1) = 1 exacto.
const p3 = probAtLeast({
  deckSize: 10,
  copies: 4,
  mulligan: 2,
  extraDraws: 9,
  atLeast: 1,
});
check(
  'caso 3 · 10/4/2/9/1 finito en [0,1]',
  Number.isFinite(p3) && p3 >= 0 && p3 <= 1,
  `obtenido ${p3}`,
);
check(
  'caso 3 · 10/4/2/9/1 ≈ 1 (ves el mazo entero)',
  Math.abs(p3 - 1) < 1e-9,
  `obtenido ${p3.toFixed(12)}`,
);

// Caso 4: T1 en 1v1 estándar (deckSize=40, copies=8, mulligan=2, extraDraws=1
// porque ambos jugadores roban en T1, atLeast=1). Cartas vistas = 4+2+1 = 7.
// La probabilidad esperada es ≈ 0.819.
const p4 = probAtLeast({
  deckSize: 40,
  copies: 8,
  mulligan: 2,
  extraDraws: 1,
  atLeast: 1,
});
check(
  'caso 4 · T1 1v1 estándar (40/8/2/1/1) ≈ 0.819',
  Math.abs(p4 - 0.819) < 1e-3,
  `obtenido ${p4.toFixed(6)}, esperado ≈ 0.819`,
);

// --- Combo multivariado --------------------------------------------------

// Caso 5: combo de 2 cartas (3 copias cada una, umbral 1), sin mulligan,
// mano inicial. Cerrado por inclusión-exclusión:
//   P = 1 - 2·C(37,4)/C(40,4) + C(34,4)/C(40,4)
//     = (91390 - 2·66045 + 46376)/91390 = 5676/91390 ≈ 0.062109.
const p5 = probCombo({
  deckSize: 40,
  cards: [
    { copies: 3, atLeast: 1 },
    { copies: 3, atLeast: 1 },
  ],
  mulligan: 0,
  extraDraws: 0,
});
check(
  'caso 5 · combo 2 cartas, mano inicial ≈ 0.062109',
  Math.abs(p5 - 5676 / 91390) < 1e-6,
  `obtenido ${p5.toFixed(8)}, esperado ${(5676 / 91390).toFixed(8)}`,
);

// Caso 6: combo de 3 cartas (4 copias cada una, umbral 1), sin mulligan,
// mano inicial. Cerrado por inclusión-exclusión sobre 3 eventos:
//   P = 1 - 3·C(36,4)/C(40,4) + 3·C(32,4)/C(40,4) - C(28,4)/C(40,4)
//     = (91390 - 3·58905 + 3·35960 - 20475)/91390 = 2080/91390 ≈ 0.022760.
const p6 = probCombo({
  deckSize: 40,
  cards: [
    { copies: 4, atLeast: 1 },
    { copies: 4, atLeast: 1 },
    { copies: 4, atLeast: 1 },
  ],
  mulligan: 0,
  extraDraws: 0,
});
check(
  'caso 6 · combo 3 cartas, mano inicial ≈ 0.022760',
  Math.abs(p6 - 2080 / 91390) < 1e-6,
  `obtenido ${p6.toFixed(8)}, esperado ${(2080 / 91390).toFixed(8)}`,
);

// Caso 7: degenerado — pides 3 copias de una carta que solo tiene 2 en el
// mazo. Imposible cumplir el combo, debe ser 0 exacto.
const p7 = probCombo({
  deckSize: 40,
  cards: [
    { copies: 2, atLeast: 3 },
    { copies: 3, atLeast: 1 },
  ],
  mulligan: 0,
  extraDraws: 0,
});
check(
  'caso 7 · combo imposible (atLeast > copies) = 0 exacto',
  p7 === 0,
  `obtenido ${p7}`,
);

// Caso 8: monotonicidad del mulligan sobre combo. m=2 nunca debe ser peor
// que m=0 con los mismos parámetros, igual que en el modo Individual.
const p8m0 = probCombo({
  deckSize: 40,
  cards: [
    { copies: 3, atLeast: 1 },
    { copies: 3, atLeast: 1 },
  ],
  mulligan: 0,
  extraDraws: 0,
});
const p8m2 = probCombo({
  deckSize: 40,
  cards: [
    { copies: 3, atLeast: 1 },
    { copies: 3, atLeast: 1 },
  ],
  mulligan: 2,
  extraDraws: 0,
});
check(
  'caso 8 · combo: mulligan ↑ ⇒ P(combo) ↑',
  p8m2 >= p8m0 - 1e-12,
  `m=0 → ${p8m0.toFixed(6)}, m=2 → ${p8m2.toFixed(6)}`,
);

if (failed > 0) {
  // biome-ignore lint: script CLI, console intencional.
  console.error(`\n${failed} aserción(es) fallaron.`);
  process.exit(1);
}
// biome-ignore lint: script CLI, console intencional.
console.log('\n✓ Todos los casos pasan.');
