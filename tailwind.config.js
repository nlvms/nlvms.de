/** @type {import('tailwindcss').Config} */
const colors = require("tailwindcss/colors");
module.exports = {
  content: ["./src/**/*.{njk,js,html,md,yml,yaml}"],
  theme: {
    extend: {
      colors: {
        "dark-gray": {
          light: colors.gray[600],
          accent: colors.gray[700],
          DEFAULT: colors.gray[800],
        },
      },
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            "--tw-prose-invert-headings": theme("colors.gray[200]"),
            "--tw-prose-invert-links": theme("colors.teal[200]"),
            "--tw-prose-invert-bold": theme("colors.gray[200]"),
          },
        },
      }),
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
