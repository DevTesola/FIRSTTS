module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        orbitron: ['"Orbitron"', 'sans-serif'],
        sans: ['"Orbitron"', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
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
        logoPulse: {
          "0%": { filter: "brightness(1) drop-shadow(0 0 5px rgba(255, 255, 255, 0.7))" },
          "50%": { filter: "brightness(1.5) drop-shadow(0 0 15px rgba(120, 80, 255, 0.9))" },
          "100%": { filter: "brightness(1) drop-shadow(0 0 5px rgba(255, 255, 255, 0.7))" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        gradientXY: {
          "0%": { backgroundPosition: "0% 0%" },
          "25%": { backgroundPosition: "100% 0%" },
          "50%": { backgroundPosition: "100% 100%" },
          "75%": { backgroundPosition: "0% 100%" },
          "100%": { backgroundPosition: "0% 0%" },
        },
        spinSlow: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        floatUp: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        planetEntryLeft: {
          "0%": { transform: "translateX(-700px) translateY(-400px) scale(0.2) rotate(-40deg)", opacity: "0" },
          "20%": { transform: "translateX(-400px) translateY(-250px) scale(0.3) rotate(-30deg)", opacity: "0.3" },
          "60%": { transform: "translateX(100px) translateY(-80px) scale(0.6) rotate(-15deg)", opacity: "0.7" },
          "80%": { transform: "translateX(30px) translateY(-20px) scale(0.9) rotate(-5deg)", opacity: "0.9" },
          "95%": { transform: "translateX(-5px) translateY(5px) scale(1.03) rotate(2deg)", opacity: "1" },
          "100%": { transform: "translateX(120px) translateY(0) scale(1) rotate(0deg)", opacity: "1" }
        },
        planetEntryRight: {
          "0%": { transform: "translateX(700px) translateY(-400px) scale(0.2) rotate(40deg)", opacity: "0" },
          "20%": { transform: "translateX(400px) translateY(-250px) scale(0.3) rotate(30deg)", opacity: "0.3" },
          "60%": { transform: "translateX(-100px) translateY(-80px) scale(0.6) rotate(15deg)", opacity: "0.7" },
          "80%": { transform: "translateX(-30px) translateY(-20px) scale(0.9) rotate(5deg)", opacity: "0.9" },
          "95%": { transform: "translateX(5px) translateY(5px) scale(1.03) rotate(-2deg)", opacity: "1" },
          "100%": { transform: "translateX(-120px) translateY(0) scale(1) rotate(0deg)", opacity: "1" }
        },
        entryShadow: {
          "0%": { boxShadow: "0 0 0 rgba(0, 0, 0, 0)" },
          "40%": { boxShadow: "0 0 15px rgba(80, 80, 180, 0.4)" },
          "70%": { boxShadow: "0 0 30px rgba(100, 100, 255, 0.8)" },
          "85%": { boxShadow: "0 0 50px rgba(120, 120, 255, 0.9)" },
          "100%": { boxShadow: "0 10px 25px rgba(60, 60, 200, 0.3)" }
        },
        planetTrail: {
          "0%": { width: "0px", height: "0px", opacity: "0" },
          "30%": { width: "200px", height: "10px", opacity: "0.7" },
          "100%": { width: "500px", height: "3px", opacity: "0" }
        },
        planetArrival: {
          "0%": { transform: "scale(0)", opacity: "0" },
          "30%": { transform: "scale(1.5)", opacity: "0.9" },
          "100%": { transform: "scale(3)", opacity: "0" }
        },
        sparkle: {
          "0%": { transform: "scale(0) rotate(0deg)", opacity: "0" },
          "50%": { transform: "scale(1) rotate(180deg)", opacity: "1" },
          "100%": { transform: "scale(0) rotate(360deg)", opacity: "0" }
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
        fireParticle: {
          '0%': { transform: 'translateY(0) translateX(0)', opacity: '0.9', scale: '1' },
          '25%': { transform: 'translateY(15px) translateX(-5px)', opacity: '0.8', scale: '0.8' },
          '50%': { transform: 'translateY(30px) translateX(5px)', opacity: '0.6', scale: '0.6' },
          '75%': { transform: 'translateY(45px) translateX(-3px)', opacity: '0.3', scale: '0.4' },
          '100%': { transform: 'translateY(60px) translateX(2px)', opacity: '0', scale: '0.1' },
        },
      },
      animation: {
        gradientBackground: "gradientBackground 20s linear infinite",
        neon: "neonGlow 1.5s ease-in-out infinite alternate",
        'fadeIn': 'fadeIn 0.3s ease-in forwards',
        'fadeOut': 'fadeOut 0.3s ease-out forwards',
        'scaleIn': 'scaleIn 0.3s ease-in forwards',
        'scaleOut': 'scaleOut 0.2s ease-out forwards',
        'bounce-slow': 'bounce 8s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spinSlow 15s linear infinite',
        'spin-reverse': 'spin 3s linear infinite reverse',
        'fireParticle': 'fireParticle 1.5s ease-out infinite',
        'logo-pulse': 'logoPulse 2s ease-in-out infinite',
        'planetEntryLeft': 'planetEntryLeft 5s ease-out forwards',
        'planetEntryRight': 'planetEntryRight 5s ease-out forwards',
        'entryShadow': 'entryShadow 4s ease-out forwards',
        'planetTrail': 'planetTrail 3s ease-out forwards',
        'planetArrival': 'planetArrival 1s ease-out forwards',
        'sparkle': 'sparkle 1.5s ease-out forwards',
        'shimmer': 'shimmer 8s ease-in-out infinite',
        'gradient-xy': 'gradientXY 15s ease-in-out infinite',
        'float-up': 'floatUp 3s ease-in-out infinite',
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