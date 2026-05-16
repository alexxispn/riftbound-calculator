// Verificación del motor matemático.
//
// Uso:
//   node --experimental-strip-types scripts/verify-hypergeometric.ts
//
// Cuatro casos:
//   1. Precisión sobre el caso canónico del spec (40/8/0/0/1 → ≈ 0.60652).
//   2. Direccionalidad del mulligan: mulligar 2 nunca debe bajar P(≥1).
//   3. Edge case con draws > pool (10/4/2/9/1): el clamp evita NaN y, dado
//      que ves el mazo entero, P(≥1) = 1 exactamente.
//   4. T1 en 1v1 estándar (40/8/2/1/1 → ≈ 0.819). Ambos jugadores roban una
//      carta en T1, así que esta probabilidad es la primera fila de la tabla
//      independientemente del orden de turno.

import { probAtLeast } from '../src/lib/hypergeometric.ts';

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

if (failed > 0) {
  // biome-ignore lint: script CLI, console intencional.
  console.error(`\n${failed} aserción(es) fallaron.`);
  process.exit(1);
}
// biome-ignore lint: script CLI, console intencional.
console.log('\n✓ Todos los casos pasan.');
