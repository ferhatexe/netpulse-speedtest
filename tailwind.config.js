/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // `xs:` was already used in the markup (e.g. the POP badge in SpeedTestHero)
      // but never defined, so those elements stayed hidden at every width
      screens: {
        xs: '475px'
      },
      colors: {
        'warm-canvas': '#F6F6F2',
        'carbon': '#121316',
        'brand-lime': '#88E724',
        'brand-lime-dark': '#74DB00'
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"Space Grotesk"', 'monospace'],
      }
    },
  },
  plugins: [],
}
