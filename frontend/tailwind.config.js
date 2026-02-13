/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        inter: ["Inter", "system-ui", "sans-serif"]
      },
      colors: {
        nexus: {
          50: "#f4f7ff",
          100: "#e4ebff",
          200: "#c4d2ff",
          500: "#4a63ff",
          600: "#3548d6",
          900: "#0b1029"
        }
      },
      backdropBlur: {
        xs: "2px"
      }
    }
  },
  plugins: []
};

