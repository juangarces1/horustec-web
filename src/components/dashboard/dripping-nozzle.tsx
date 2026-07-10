interface DrippingNozzleProps {
  /** Nombre del producto — colorea la gota y el charco (Regular, Super, Diesel, Exonerado). */
  product?: string;
  className?: string;
}

// Misma paleta por producto que product-trend-chart.tsx
const FUEL_COLORS: Record<string, { drop: string; puddle: string }> = {
  Regular: { drop: '#f59e0b', puddle: '#fbbf24' },
  Super: { drop: '#ef4444', puddle: '#f87171' },
  Diesel: { drop: '#3b82f6', puddle: '#60a5fa' },
  Exonerado: { drop: '#10b981', puddle: '#34d399' },
};

const DEFAULT_COLORS = { drop: '#f59e0b', puddle: '#fbbf24' };

// Pistola de combustible con gota cayendo y charco ondulante.
// Animación 100% CSS (ver keyframes fuel-drip / fuel-puddle en globals.css).
export function DrippingNozzle({ product, className }: DrippingNozzleProps) {
  const colors = (product && FUEL_COLORS[product]) || DEFAULT_COLORS;

  return (
    <svg
      viewBox="0 0 32 40"
      width={32}
      height={40}
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id="fuelBodyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fb923c" />
          <stop offset="1" stopColor="#ea580c" />
        </linearGradient>
        <linearGradient id="fuelGripGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ea580c" />
          <stop offset="1" stopColor="#9a3412" />
        </linearGradient>
        <linearGradient id="fuelSpoutGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c2410c" />
          <stop offset="1" stopColor="#7c2d12" />
        </linearGradient>
      </defs>

      {/* Guarda del gatillo */}
      <path
        d="M10.5 26.5 C14 26.5 16.5 24 17 20.5 L17.3 17.5"
        stroke="#c2410c"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {/* Mango */}
      <path
        d="M5 17 H11 L9.5 26.5 C9.4 27.4 8.6 28 7.7 28 H6 C5 28 4.2 27.1 4.3 26.1 Z"
        fill="url(#fuelGripGrad)"
      />
      {/* Boquilla */}
      <path
        d="M21 9.5 C24.5 10 27 11.5 27.5 14 C27.7 15.2 27.8 16.5 27.8 18.5 L24.2 18.5 C24.2 16.8 24.1 15.6 23.8 14.9 C23.4 14 22.3 13.4 20.8 13.1 Z"
        fill="url(#fuelSpoutGrad)"
      />
      {/* Cuerpo */}
      <path
        d="M6 7 H18 C20.8 7 23 9.2 23 12 V15.5 C23 16.3 22.3 17 21.5 17 H6 C4.3 17 3 15.7 3 14 V10 C3 8.3 4.3 7 6 7 Z"
        fill="url(#fuelBodyGrad)"
      />
      {/* Brillo del cuerpo */}
      <ellipse cx="10" cy="10" rx="5" ry="1.6" fill="#ffffff" opacity="0.3" />

      {/* Gotas (forma de lágrima, dos desfasadas para goteo continuo) */}
      <g transform="translate(26 21)">
        <path
          className="fuel-drop"
          d="M0 -2.6 C1.1 -1.2 1.8 -0.3 1.8 0.7 A1.8 1.8 0 1 1 -1.8 0.7 C-1.8 -0.3 -1.1 -1.2 0 -2.6 Z"
          fill={colors.drop}
        />
      </g>
      <g transform="translate(26 21) scale(0.75)">
        <path
          className="fuel-drop fuel-drop-delayed"
          d="M0 -2.6 C1.1 -1.2 1.8 -0.3 1.8 0.7 A1.8 1.8 0 1 1 -1.8 0.7 C-1.8 -0.3 -1.1 -1.2 0 -2.6 Z"
          fill={colors.puddle}
        />
      </g>

      {/* Charquito */}
      <ellipse
        className="fuel-puddle"
        cx="26"
        cy="37"
        rx="5.2"
        ry="1.7"
        fill={colors.puddle}
      />
    </svg>
  );
}
