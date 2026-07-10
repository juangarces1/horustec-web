'use client';

import { cn } from '@/lib/utils';

interface RollingNumberProps {
  /** Número ya formateado (ej. "16.428" o "24.52"); solo los dígitos ruedan. */
  text: string;
  className?: string;
}

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

// Contador estilo odómetro: cada dígito es una tira vertical 0-9 que se
// desplaza con CSS transition hasta el dígito actual.
export function RollingNumber({ text, className }: RollingNumberProps) {
  return (
    <span
      className={cn('inline-flex overflow-hidden leading-none align-baseline', className)}
      aria-label={text}
    >
      <span aria-hidden="true" className="contents">
        {text.split('').map((ch, i) => {
          // Clave desde la derecha: al pasar de 999 a 1.000 la columna de
          // unidades conserva su identidad y no salta.
          const key = text.length - i;
          const digit = DIGITS.indexOf(ch);

          if (digit === -1) {
            return (
              <span key={`sep-${key}`} className="inline-block">
                {ch}
              </span>
            );
          }

          return (
            <span key={key} className="inline-block h-[1em] overflow-hidden">
              <span
                className="block transition-transform duration-700 ease-out motion-reduce:transition-none"
                style={{ transform: `translateY(-${digit}em)` }}
              >
                {DIGITS.map((n) => (
                  <span key={n} className="block h-[1em]">
                    {n}
                  </span>
                ))}
              </span>
            </span>
          );
        })}
      </span>
    </span>
  );
}
