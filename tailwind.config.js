export default {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      fontFamily: {
        title: ["Bungee", "sans-serif"],
        heading: ["Anton", "sans-serif"],
      },
    },
    colors: {
      primary: "#3d2466", // Russian Violet
      secondary: "#010400", // Black
      background: "#E9EBF8", // Lavender(White)
      accent: "#fcb44b", // Hunyadi yellow
      gradientEnd: "#4e598c", // YinMn Blue
    },
  },
  plugins: [],
};
