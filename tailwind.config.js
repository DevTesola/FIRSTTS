module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        orbitron: ['"Orbitron"', 'sans-serif'],
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
      },
      animation: {
        gradientBackground: "gradientBackground 20s linear infinite",
        neon: "neonGlow 1.5s ease-in-out infinite alternate",
      },
    },
  },
  plugins: [],
};
