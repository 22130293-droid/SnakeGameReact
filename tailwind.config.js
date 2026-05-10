/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          cyan: '#00f3ff',
          green: '#39ff14',
          pink: '#ff00ff',
        },
        dark: {
          bg: '#0a0a0f',
          surface: '#12121a',
        }
      },
      fontFamily: {
        'press-start': ['"Press Start 2P"', 'cursive'],
        'fira-code': ['"Fira Code"', 'monospace'],
      },
      animation: {
        'neon-pulse': 'neon-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'neon-pulse': {
          '0%, 100%': { opacity: 1, textShadow: '0 0 10px #39ff14, 0 0 20px #39ff14' },
          '50%': { opacity: .8, textShadow: '0 0 5px #39ff14, 0 0 10px #39ff14' },
        }
      }
    },
  },
  plugins: [],
}
