/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base: {
          blue: '#0052FF',
          dark: '#0A0B0D',
          card: '#111318',
          border: '#1E2128',
          muted: '#6B7280',
          text: '#F9FAFB',
          accent: '#0052FF',
        },
      },
      fontFamily: {
        sans: ['Coinbase Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['Coinbase Mono', 'JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease forwards',
        'slide-up': 'slideUp 0.4s ease forwards',
        'pulse-slow': 'pulse 3s infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
