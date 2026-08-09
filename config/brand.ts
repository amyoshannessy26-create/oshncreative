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

  // Brand board, from Amy:
  //   #BEC5A4 sage  ·  #D9D9D9 light grey  ·  #676663 warm charcoal
  // success/warning/danger are functional UI states, not brand colors — kept
  // standard (with success re-hued toward the brand sage) since they need to
  // read unambiguously regardless of palette.
  //
  // Light theme palette (HSL channel strings, no `hsl()` wrapper — lets us
  // apply alpha at the call site, e.g. `hsl(var(--brand-primary) / 0.1)`).
  colors: {
    light: {
      primary: "45 2% 40%", // #676663 warm charcoal
      primaryForeground: "0 0% 100%",
      accent: "73 22% 71%", // #BEC5A4 sage
      accentForeground: "45 2% 40%",
      background: "0 0% 85%", // #D9D9D9 light grey — page canvas behind white cards
      foreground: "45 2% 40%", // #676663
      muted: "0 0% 91%",
      mutedForeground: "45 3% 46%",
      border: "0 0% 85%", // #D9D9D9
      card: "0 0% 100%",
      cardForeground: "45 2% 40%",
      success: "75 25% 32%", // deeper shade of the brand sage
      warning: "38 92% 50%",
      danger: "0 72% 51%",
    },
    // Reserved for a future dark theme. Structure mirrors `light` exactly so
    // enabling dark mode later is a data change, not a rewrite — see the
    // `[data-theme="dark"]` block generated in globals.css.
    dark: {
      primary: "45 3% 70%",
      primaryForeground: "45 4% 12%",
      accent: "73 25% 65%",
      accentForeground: "45 4% 12%",
      background: "45 4% 10%",
      foreground: "0 0% 92%",
      muted: "45 4% 16%",
      mutedForeground: "0 0% 65%",
      border: "45 4% 22%",
      card: "45 4% 13%",
      cardForeground: "0 0% 92%",
      success: "75 28% 55%",
      warning: "38 92% 55%",
      danger: "0 72% 61%",
    },
  },

  // Bodoni FLF isn't distributed as a web font (no Google Fonts / CDN
  // license), so headings render with Bodoni Moda — a Google Fonts variable
  // serif in the same high-contrast Didone style — as a stand-in. Drop
  // licensed Bodoni FLF .woff2 files in /public/fonts and swap the
  // next/font/google call in src/app/layout.tsx for next/font/local to use
  // the real thing.
  fonts: {
    heading: "var(--font-heading)",
    body: "var(--font-body)",
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
