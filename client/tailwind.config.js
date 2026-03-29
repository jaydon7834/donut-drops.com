/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        abyss: "#07080d",
        panel: "#11131b",
        accent: "#f97316",
        highlight: "#fb7185",
        mint: "#34d399"
      },
      boxShadow: {
        neon: "0 0 30px rgba(249, 115, 22, 0.16)"
      },
      backgroundImage: {
        "hero-glow":
          "radial-gradient(circle at top, rgba(249,115,22,0.24), transparent 30%), radial-gradient(circle at 80% 20%, rgba(251,113,133,0.2), transparent 20%)"
      }
    }
  },
  plugins: []
};
