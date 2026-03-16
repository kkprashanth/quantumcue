/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Navy Color Scale (Primary Brand)
        navy: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#243b53',
          900: '#102a43', // Primary brand color
        },
        // Quantum Accent Scale (Navy-based)
        quantum: {
          50: '#f0f4f8',   // Lightest navy
          100: '#d9e2ec',  // Very light navy
          200: '#bcccdc',  // Light navy
          300: '#9fb3c8',  // Medium-light navy
          400: '#829ab1',  // Medium navy
          500: '#334e68',  // Primary quantum accent (navy-700)
          600: '#243b53',  // Dark navy
          700: '#102a43',  // Darker navy
          800: '#0a1f33',  // Darkest navy
        },
        'quantum-purple': '#334e68', // Alias for quantum-500 (navy-700)
        // Quantum Cyan Scale
        cyan: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4', // Primary quantum cyan
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
        },
        // Success Colors
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        // Warning Colors
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
        },
        // Error Colors
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
        },
        // Info Colors
        info: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
        },
        // Neutral Grey Scale (Cool-toned)
        grey: {
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
        },
        brand: {
          50: '#3850A0',
        },
        // Legacy aliases for backward compatibility (light theme defaults)
        background: '#f8fafc', // grey-50
        surface: '#ffffff',
        'surface-elevated': '#f1f5f9', // grey-100
        border: '#e2e8f0', // grey-200
        'border-subtle': '#cbd5e1', // grey-300
        'text-primary': '#334155', // grey-700
        'text-secondary': '#64748b', // grey-500
        'text-tertiary': '#94a3b8', // grey-400
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
        display: ['Inter Display', 'Inter', 'sans-serif'],
      },
      fontSize: {
        // Display Sizes
        'display-lg': ['3.75rem', { lineHeight: '1', fontWeight: '800' }], // 60px
        'display-md': ['3rem', { lineHeight: '1', fontWeight: '800' }], // 48px
        'display-sm': ['2.25rem', { lineHeight: '1.1', fontWeight: '700' }], // 36px
        // Heading Sizes
        'h1': ['2rem', { lineHeight: '1.25', fontWeight: '700' }], // 32px
        'h2': ['1.5rem', { lineHeight: '1.25', fontWeight: '600' }], // 24px
        'h3': ['1.25rem', { lineHeight: '1.25', fontWeight: '600' }], // 20px
        'h4': ['1.125rem', { lineHeight: '1.375', fontWeight: '600' }], // 18px
        // Body Sizes
        'lg': ['1.125rem', { lineHeight: '1.5' }], // 18px
        'base': ['1rem', { lineHeight: '1.5' }], // 16px
        'sm': ['0.875rem', { lineHeight: '1.5' }], // 14px
        'xs': ['0.75rem', { lineHeight: '1.5' }], // 12px
        // Code/Metrics
        'code-lg': ['1rem', { lineHeight: '1.5' }],
        'code-base': ['0.875rem', { lineHeight: '1.5' }],
        'code-sm': ['0.75rem', { lineHeight: '1.5' }],
      },
      fontWeight: {
        thin: '100',
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
      },
      lineHeight: {
        tight: '1.25',
        snug: '1.375',
        normal: '1.5',
        relaxed: '1.625',
        loose: '2',
      },
      borderRadius: {
        DEFAULT: '0.5rem', // 8px
        'sm': '0.375rem', // 6px
        'md': '0.5rem', // 8px
        'lg': '0.75rem', // 12px
        'xl': '1rem', // 16px
        'full': '9999px',
      },
      boxShadow: {
        'sm': '0 1px 3px rgba(0, 0, 0, 0.05)',
        'md': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'lg': '0 8px 24px rgba(0, 0, 0, 0.12)',
        'quantum': '0 0 20px rgba(51, 78, 104, 0.15)',
        'surface': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'elevated': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #102a43 0%, #243b53 100%)',
        'gradient-primary-hover': 'linear-gradient(135deg, #243b53 0%, #334e68 100%)',
        'gradient-quantum': 'linear-gradient(135deg, #627d98 0%, #486581 100%)',
        'gradient-quantum-hover': 'linear-gradient(135deg, #486581 0%, #334e68 100%)',
        'gradient-card': 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        'quantum-gradient': 'linear-gradient(135deg, #a855f7 0%, #06b6d4 100%)', // Legacy alias
      },
      spacing: {
        // Base unit: 4px
        '0': '0',
        '1': '0.25rem', // 4px
        '2': '0.5rem', // 8px
        '3': '0.75rem', // 12px
        '4': '1rem', // 16px
        '5': '1.25rem', // 20px
        '6': '1.5rem', // 24px
        '8': '2rem', // 32px
        '10': '2.5rem', // 40px
        '12': '3rem', // 48px
        '16': '4rem', // 64px
        '20': '5rem', // 80px
        '24': '6rem', // 96px
      },
      animation: {
        'fade-in': 'fadeIn 0.3s cubic-bezier(0.0, 0.0, 0.2, 1)',
        'scale-pop': 'scalePop 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
        'shimmer': 'shimmer 2s infinite linear',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scalePop: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      transitionTimingFunction: {
        'standard': 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        'decelerate': 'cubic-bezier(0.0, 0.0, 0.2, 1)',
        'accelerate': 'cubic-bezier(0.4, 0.0, 1, 1)',
        'sharp': 'cubic-bezier(0.4, 0.0, 0.6, 1)',
      },
      transitionDuration: {
        'instant': '100ms',
        'fast': '150ms',
        'normal': '200ms',
        'slow': '300ms',
        'slower': '500ms',
      },
    },
  },
  plugins: [],
}
