import { useState } from 'react';
import ComboCalculator from './ComboCalculator';
import IndividualCalculator from './IndividualCalculator';
import ModeTabs, { type Mode } from './ModeTabs';

export default function Calculator() {
  const [mode, setMode] = useState<Mode>('individual');

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

      <div
        className="mt-8 animate-rise sm:mt-10"
        style={{ animationDelay: '60ms' }}
      >
        <ModeTabs mode={mode} onChange={setMode} />
      </div>

      {mode === 'individual' ? <IndividualCalculator /> : <ComboCalculator />}
    </main>
  );
}
