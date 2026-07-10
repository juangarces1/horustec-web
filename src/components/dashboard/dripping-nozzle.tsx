interface DrippingNozzleProps {
  className?: string;
}

// Pistola de combustible estilizada con gota cayendo y charco ondulante.
// Animación 100% CSS (ver keyframes fuel-drip / fuel-puddle en globals.css).
export function DrippingNozzle({ className }: DrippingNozzleProps) {
  return (
    <svg
      viewBox="0 0 32 40"
      width={32}
      height={40}
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {/* Cuerpo de la pistola */}
      <rect x="2" y="7" width="20" height="11" rx="2.5" fill="#f97316" />
      {/* Brillo del cuerpo */}
      <rect x="5" y="9.5" width="9" height="2.5" rx="1.25" fill="#fdba74" />
      {/* Mango / gatillo */}
      <path d="M7 18h6v5a3 3 0 0 1-3 3H7z" fill="#ea580c" />
      {/* Pico hacia abajo */}
      <path d="M22 9h4.5a2 2 0 0 1 2 2v6.5h-4V13H22z" fill="#ea580c" />
      {/* Gotas (dos, desfasadas, para goteo continuo) */}
      <circle className="fuel-drop" cx="26.5" cy="19.5" r="2" fill="#f59e0b" />
      <circle
        className="fuel-drop fuel-drop-delayed"
        cx="26.5"
        cy="19.5"
        r="1.5"
        fill="#fbbf24"
      />
      {/* Charquito */}
      <ellipse
        className="fuel-puddle"
        cx="26.5"
        cy="37"
        rx="5"
        ry="1.6"
        fill="#fbbf24"
      />
    </svg>
  );
}
