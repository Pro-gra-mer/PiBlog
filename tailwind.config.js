import defaultTheme from "tailwindcss/defaultTheme";

export default {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      fontFamily: {
        title: ["Bungee", "sans-serif"],
        heading: ["Anton", "sans-serif"],
      },
      colors: {
        primary: "#3d2466",
        secondary: "#010400",
        background: "#f4f5fb",
        accent: "#fcb44b",
        gradientEnd: "#4e598c",
      },
    },
  },
  plugins: [],
};
