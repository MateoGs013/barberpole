/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        fondo: '#050505',
        superficie: '#0c0c0e',
        elevado: '#141417',
        negro: '#050505',
        crema: '#050505', // compat
        'rojo-faro': '#E60026',
        'azul-faro': '#0044CC',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        bruta: '0 0 0 1px rgba(255, 255, 255, 0.1)',
        'bruta-sm': '0 0 0 1px rgba(255, 255, 255, 0.15)',
        'bruta-lg': '0 0 30px -5px rgba(255, 255, 255, 0.08)',
        glow: '0 0 25px -4px rgba(255, 255, 255, 0.18)',
        island: '0 20px 40px -10px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.12)',
      },
      borderWidth: {
        3: '1px', // suaviza bordes anteriores a 1px fino
      },
      animation: {
        'pulse-subtle': 'pulseSubtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
    },
  },
  plugins: [],
}
