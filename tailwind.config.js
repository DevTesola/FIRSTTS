module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        orbitron: ['"Orbitron"', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      colors: {
        // Custom theme colors for TESOLA
        'tesola': {
          50: '#f0e7ff',
          100: '#e0d0ff',
          200: '#c4a5ff',
          300: '#a77aff',
          400: '#8a4fff',
          500: '#7c2cf8',
          600: '#6a18e6',
          700: '#5813c0',
          800: '#48119a',
          900: '#38107a',
        },
      },
      keyframes: {
        gradientBackground: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        neonGlow: {
          "0%": { textShadow: "0 0 5px #fff, 0 0 10px #fff" },
          "100%": { textShadow: "0 0 20px #ff00de, 0 0 30px #ff00de, 0 0 40px #ff00de" },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        scaleOut: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.95)', opacity: '0' },
        },
      },
      animation: {
        gradientBackground: "gradientBackground 20s linear infinite",
        neon: "neonGlow 1.5s ease-in-out infinite alternate",
        'fadeIn': 'fadeIn 0.3s ease-in forwards',
        'fadeOut': 'fadeOut 0.3s ease-out forwards',
        'scaleIn': 'scaleIn 0.3s ease-in forwards',
        'scaleOut': 'scaleOut 0.2s ease-out forwards',
        'bounce-slow': 'bounce 3s infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-reverse': 'spin 3s linear infinite reverse',
      },
      animationDelay: {
        '150': '150ms',
        '300': '300ms',
        '500': '500ms',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      boxShadow: {
        'glow': '0 0 10px rgba(147, 51, 234, 0.3), 0 0 20px rgba(147, 51, 234, 0.2)',
        'glow-lg': '0 0 15px rgba(147, 51, 234, 0.4), 0 0 30px rgba(147, 51, 234, 0.3)',
      },
    },
  },
  plugins: [],
};