/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#1e3a5f', dark: '#162d4a', light: '#254d7a' },
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(16px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: {
        'fade-in':  'fadeIn 0.35s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-up-1': 'slideUp 0.4s ease-out 0.08s both',
        'slide-up-2': 'slideUp 0.4s ease-out 0.16s both',
        'slide-up-3': 'slideUp 0.4s ease-out 0.24s both',
      },
    },
  },
  plugins: [],
}
