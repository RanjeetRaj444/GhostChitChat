/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f4fd',
          100: '#e0e9fa',
          200: '#c7d7f5',
          300: '#9ebbed',
          400: '#6d98e3',
          500: '#4a7bd8',
          600: '#3560cc',
          700: '#2d4db8',
          800: '#2a4297',
          900: '#273b78',
          950: '#1a244a',
        },
        secondary: {
          50: '#f1fcf9',
          100: '#d0f7ee',
          200: '#a0edd9',
          300: '#6cdec0',
          400: '#36c4a0',
          500: '#1aad89',
          600: '#139274',
          700: '#137360',
          800: '#145c4f',
          900: '#144b42',
          950: '#092b27',
        },
        accent: {
          50: '#fff9eb',
          100: '#ffefc6',
          200: '#ffdc87',
          300: '#ffc247',
          400: '#ffa91c',
          500: '#ff8800',
          600: '#e06200',
          700: '#b93f00',
          800: '#982f08',
          900: '#7c270c',
          950: '#481200',
        },
        success: {
          500: '#22c55e',
          600: '#16a34a',
        },
        warning: {
          500: '#f59e0b',
          600: '#d97706',
        },
        error: {
          500: '#ef4444',
          600: '#dc2626',
        },
        neutral: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      boxShadow: {
        'chat': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'chat-dark': '0 2px 8px rgba(0, 0, 0, 0.25)',
      },
    },
  },
  plugins: [],
}