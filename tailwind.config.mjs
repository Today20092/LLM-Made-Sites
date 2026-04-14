/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#060816',
          900: '#0b1024',
          800: '#121935',
        },
        paper: '#f4eddc',
        sand: '#d9c8a8',
        moss: '#8abf8a',
        coral: '#f28f75',
        gold: '#f3c969',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(255,255,255,0.08), 0 22px 60px rgba(0,0,0,0.35)',
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Manrope', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
