/**
 * Single source of truth for white-label branding.
 * Swap these values to re-skin the whole app — no component code changes needed.
 * Colors are emitted as CSS variables in `src/app/globals.css` (see `toCssVariables` below,
 * wired up in `src/app/layout.tsx`).
 */

export const brand = {
  businessName: "OSHN Creative",
  tagline: "Virtual Assistant Services",

  // Shown in the sidebar. Swap the file at /public/logo.svg (and update the path
  // below if you rename it). Falls back to initials if no logo is set.
  logo: {
    src: "/logo.svg",
    alt: "OSHN Creative logo",
    width: 32,
    height: 32,
  },

  // Light theme palette (HSL channel strings, no `hsl()` wrapper — lets us
  // apply alpha at the call site, e.g. `hsl(var(--brand-primary) / 0.1)`).
  // Placeholder values — replace with real brand board colors.
  colors: {
    light: {
      primary: "222 47% 24%", // deep navy
      primaryForeground: "0 0% 100%",
      accent: "27 96% 61%", // warm accent
      accentForeground: "222 47% 11%",
      background: "0 0% 100%",
      foreground: "222 47% 11%",
      muted: "220 14% 96%",
      mutedForeground: "220 9% 46%",
      border: "220 13% 91%",
      card: "0 0% 100%",
      cardForeground: "222 47% 11%",
      success: "142 71% 35%",
      warning: "38 92% 50%",
      danger: "0 72% 51%",
    },
    // Reserved for a future dark theme. Structure mirrors `light` exactly so
    // enabling dark mode later is a data change, not a rewrite — see the
    // `[data-theme="dark"]` block generated in globals.css.
    dark: {
      primary: "217 91% 70%",
      primaryForeground: "222 47% 11%",
      accent: "27 96% 61%",
      accentForeground: "222 47% 11%",
      background: "222 47% 8%",
      foreground: "210 20% 98%",
      muted: "217 33% 17%",
      mutedForeground: "215 20% 65%",
      border: "217 33% 20%",
      card: "222 47% 11%",
      cardForeground: "210 20% 98%",
      success: "142 71% 45%",
      warning: "38 92% 55%",
      danger: "0 72% 61%",
    },
  },
} as const;

export type BrandColorTokens = typeof brand.colors.light;

/** Renders a color token map as `--brand-x: h s% l%;` CSS variable declarations. */
export function toCssVariables(tokens: BrandColorTokens): string {
  return Object.entries(tokens)
    .map(([key, value]) => `--brand-${kebabCase(key)}: ${value};`)
    .join("\n  ");
}

function kebabCase(input: string): string {
  return input.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}
