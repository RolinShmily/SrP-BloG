import type { CSSProperties, SVGProps } from "react";

/**
 * Script "SrP" monogram, faithfully redrawn from the site favicon.
 *
 * The monogram features four distinct calligraphic strokes:
 * 1. S — classical double-loop flourishing capital S
 * 2. r — swift lowercase r with a sharp top-left spur and arched shoulder
 * 3. P Stem — upright, buoyant ascending vertical stem
 * 4. P Crescent Bowl — separate, suspended crescent arch crossing the top
 *    and floating openly at the waist, matching the original separated-stroke design.
 *
 * Sequential draw delays stagger the four strokes into an authentic ~1.45s handwriting cadence.
 */
export function BrandMark(props: SVGProps<SVGSVGElement>) {
  const delay = (seconds: number) => ({ "--brand-draw-delay": `${seconds}s` }) as CSSProperties;

  return (
    <svg
      viewBox="0 0 96 48"
      fill="none"
      aria-hidden="true"
      focusable="false"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <g className="brand-mark-letters">
        {/* S — classic flourishing script S: upper loop, flowing spine and sweeping lower bowl */}
        <path
          className="brand-mark-path"
          pathLength={1}
          style={delay(0.08)}
          d="M 23.8 17.5 C 25.2 8.5, 34.8 2.5, 29.0 2.5 C 21.0 2.5, 12.3 8.5, 11.9 17.5 C 11.6 24.5, 25.0 23.0, 24.5 32.5 C 24.0 41.5, 9.0 43.8, 5.8 37.0 C 4.2 33.5, 6.0 29.5, 10.0 28.0"
        />
        {/* r — upright stem rising to a distinct top-left spur, springing into a buoyant shoulder arch */}
        <path
          className="brand-mark-path"
          pathLength={1}
          style={delay(0.42)}
          d="M 37.5 41.5 L 41.8 14.0 L 44.5 18.0 C 48.0 14.0, 54.0 14.0, 56.5 23.5"
        />
        {/* P stroke 1 — standalone upright ascending stem */}
        <path
          className="brand-mark-path"
          pathLength={1}
          style={delay(0.78)}
          d="M 64.0 42.0 L 68.8 9.5"
        />
        {/* P stroke 2 — standalone crescent bowl arching across the top and floating at the waist */}
        <path
          className="brand-mark-path"
          pathLength={1}
          style={delay(0.98)}
          d="M 60.5 10.5 C 64.0 4.0, 74.0 2.5, 82.5 3.5 C 90.5 4.5, 92.0 12.5, 86.0 20.0 C 81.0 24.0, 74.0 24.0, 68.5 22.5"
        />
      </g>
    </svg>
  );
}
