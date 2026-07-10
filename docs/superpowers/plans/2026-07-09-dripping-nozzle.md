# Dripping Nozzle Indicator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show an animated fuel-nozzle SVG (falling drop + rippling puddle) at the left of each active-fueling row in the dashboard's "Abasteciendo Ahora" section.

**Architecture:** A new presentational component `DrippingNozzle` (inline SVG, zero props beyond `className`) animated purely with CSS keyframes defined in `globals.css`. It is inserted as the leftmost element of each row in `ActiveFuelings`, next to the existing orange dispenser-number circle, which stays unchanged. No data/logic changes.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4 (CSS-first config — keyframes go in `src/app/globals.css` as plain CSS), TypeScript.

## Global Constraints

- No new dependencies (spec explicitly rejects Framer Motion / Lottie).
- Palette: theme orange/amber (`#f97316` orange-500, `#ea580c` orange-600, `#f59e0b` amber-500, `#fbbf24` amber-400, `#fdba74` orange-300).
- SVG must have `aria-hidden="true"` (decorative).
- Animations must stop under `prefers-reduced-motion: reduce`.
- This project has NO test runner. Verification is: `npm run build` must pass (type-check + lint) and a visual check in the browser. Do NOT add a test framework.
- UI copy in Spanish, code in English (project convention).

---

### Task 1: `DrippingNozzle` component + CSS keyframes

**Files:**
- Create: `src/components/dashboard/dripping-nozzle.tsx`
- Modify: `src/app/globals.css` (append at end of file)

**Interfaces:**
- Consumes: nothing.
- Produces: `export function DrippingNozzle({ className }: { className?: string }): JSX element` — a 32×40 inline SVG. Task 2 imports it as `import { DrippingNozzle } from '@/components/dashboard/dripping-nozzle';`.

- [ ] **Step 1: Append keyframes and animation classes to `src/app/globals.css`**

Add at the very end of the file:

```css
/* Animación de pistola goteando (Abasteciendo Ahora) */
@keyframes fuel-drip {
  0% {
    transform: translateY(0);
    opacity: 0;
  }
  15% {
    opacity: 1;
  }
  80% {
    opacity: 1;
  }
  100% {
    transform: translateY(15px);
    opacity: 0;
  }
}

@keyframes fuel-puddle {
  0%,
  100% {
    transform: scaleX(1);
    opacity: 0.55;
  }
  50% {
    transform: scaleX(1.25);
    opacity: 0.9;
  }
}

.fuel-drop {
  animation: fuel-drip 1.2s cubic-bezier(0.4, 0, 1, 1) infinite;
}

.fuel-drop-delayed {
  animation-delay: 0.6s;
}

.fuel-puddle {
  transform-box: fill-box;
  transform-origin: center;
  animation: fuel-puddle 1.2s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .fuel-drop,
  .fuel-puddle {
    animation: none;
  }
  .fuel-drop {
    opacity: 0;
  }
}
```

Notes for the implementer:
- `transform-box: fill-box` is required so `scaleX` on the SVG ellipse scales around its own center instead of the SVG origin.
- `.fuel-drop` starts at `opacity: 0` in the keyframe, so under reduced motion the drops are hidden explicitly (`opacity: 0`) to avoid a frozen mid-air drop.

- [ ] **Step 2: Create `src/components/dashboard/dripping-nozzle.tsx`**

```tsx
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
```

Notes for the implementer:
- No `'use client'` directive needed: the component has no hooks or handlers, and its only consumer (`ActiveFuelings`) is already a client component.
- The drop travels from `cy=19.5` down 15px (keyframe) to ≈34.5, just above the puddle at `cy=37` — do not change one without the other.

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: build completes with no TypeScript or ESLint errors. (The component is not rendered anywhere yet; that is fine.)

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/dripping-nozzle.tsx src/app/globals.css
git commit -m "feat: add DrippingNozzle animated SVG component"
```

---

### Task 2: Integrate into `ActiveFuelings` + visual verification

**Files:**
- Modify: `src/components/dashboard/active-fuelings.tsx` (imports at top; row markup at lines 92-95 of the current file)

**Interfaces:**
- Consumes: `DrippingNozzle` from Task 1 (`import { DrippingNozzle } from '@/components/dashboard/dripping-nozzle';`).
- Produces: nothing consumed by later tasks (final task).

- [ ] **Step 1: Add the import**

At the top of `src/components/dashboard/active-fuelings.tsx`, after the existing imports:

```tsx
import { DrippingNozzle } from '@/components/dashboard/dripping-nozzle';
```

- [ ] **Step 2: Insert the component as the leftmost element of each row**

Current markup:

```tsx
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-orange-500 text-white font-bold">
                      {dispenserNumber}
                    </div>
```

Change to:

```tsx
                  <div className="flex items-center gap-3">
                    <DrippingNozzle className="shrink-0" />
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-orange-500 text-white font-bold">
                      {dispenserNumber}
                    </div>
```

The orange number circle and everything else stays exactly as-is.

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: build completes with no errors.

- [ ] **Step 4: Visual verification in the browser**

Run: `npm run dev` (serves on 0.0.0.0:3000) and open `http://192.168.1.3:3000/dashboard`.

Checks (needs at least one nozzle with status 3; if none is live, temporarily change the filter in `active-fuelings.tsx` line 50 from `status.status === 3` to `status.status >= 0` to force rows, verify, then REVERT before committing):
- Each active-fueling row shows the nozzle SVG at the far left, before the orange circle.
- A drop repeatedly falls from the spout and fades out; a second smaller drop is offset by ~0.6s.
- The puddle under the spout pulses horizontally.
- Row height is unchanged (SVG is 40px tall, same as the h-10 circle).
- Emulating `prefers-reduced-motion: reduce` (DevTools → Rendering) freezes the animation and hides the drops.

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/active-fuelings.tsx
git commit -m "feat: show dripping nozzle animation in Abasteciendo Ahora rows"
```
