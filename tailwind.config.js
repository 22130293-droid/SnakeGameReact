/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gs: {
          green:    '#4caf50',
          'green-light': '#7dd56f',
          'green-dark':  '#2e7d32',
          bg:       '#f0f4e8',
          card:     '#ffffff',
          yellow:   '#fdd835',
          orange:   '#fb8c00',
          blue:     '#1a73e8',
          red:      '#e53935',
          purple:   '#8e24aa',
          teal:     '#00897b',
          text:     '#2d4a1e',
          'text-light': '#5a7a42',
          border:   '#c8e6c9',
        },
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
        'nunito': ['"Nunito"', 'sans-serif'],
        'press-start': ['"Press Start 2P"', 'cursive'],
        'fira-code': ['"Fira Code"', 'monospace'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'card': '0 4px 16px rgba(76,175,80,0.15), 0 1px 4px rgba(0,0,0,0.08)',
        'btn':  '0 4px 12px rgba(76,175,80,0.30)',
        'btn-hover': '0 6px 20px rgba(76,175,80,0.45)',
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'wiggle': 'wiggle 0.5s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        wiggle: {
          '0%,100%': { transform: 'rotate(-4deg)' },
          '50%': { transform: 'rotate(4deg)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      }
    },
  },
  plugins: [],
}
