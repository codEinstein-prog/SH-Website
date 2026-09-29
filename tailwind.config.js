/** @type {import("tailwindcss").Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}"
  ],

  theme: {
    extend: {
      colors: {
        cream: "#F5F2EB",
        surface: "#FFFFFF",
        charcoal: "#1C1C1A",
        forest: "#31483A",
        sage: "#CBD3C6",
        dustySage: "#AEB9AB",
        gold: "#C9A46A",
        warmGray: "#6E716B",
        taupe: "#DED9CF",
        beige: "#DAD4C9",
        blueGray: "#B7C7CE",
        panel: "#2F4852"
      },

      fontFamily: {
        heading: [
          "Cormorant Garamond",
          "Georgia",
          "serif"
        ],

        body: [
          "Inter",
          "Arial",
          "sans-serif"
        ]
      },

      maxWidth: {
        site: "1180px"
      }
    }
  },

  plugins: []
};