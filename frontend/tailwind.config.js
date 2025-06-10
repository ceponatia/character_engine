/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // CharacterEngine romantic dark theme
        burgundy: {
          50: '#fdf2f4',
          100: '#fce7ea',
          200: '#f9d4db',
          300: '#f4b3bf',
          400: '#ec8599',
          500: '#e11d48',
          600: '#be123c',
          700: '#9f1239',
          800: '#881337',
          900: '#7c2d12',
        },
        plum: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7c3aed',
          800: '#6b21a8',
          900: '#581c87',
        },
        rose: {
          DEFAULT: '#e11d48',
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
        }
      },
      backgroundImage: {
        'romantic-gradient': 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #374151 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)',
        'button-gradient': 'linear-gradient(135deg, #e11d48 0%, #9333ea 100%)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          from: { 'box-shadow': '0 0 20px rgba(225, 29, 72, 0.5)' },
          to: { 'box-shadow': '0 0 30px rgba(225, 29, 72, 0.8), 0 0 40px rgba(147, 51, 234, 0.3)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        }
      }
    },
  },
  plugins: [],
}

