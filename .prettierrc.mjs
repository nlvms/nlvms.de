/** @type {import("prettier").Config} */
const config = {
  embeddedLanguageFormatting: "auto",
  htmlWhitespaceSensitivity: "css",
  printWidth: 80,
  proseWrap: "always",
  quoteProps: "as-needed",
  singleQuote: false,
  tabWidth: 2,
  trailingComma: "all",
  plugins: ["prettier-plugin-jinja-template"],
  overrides: [
    {
      files: "*.njk",
      options: {
        parser: "jinja-template",
        tabWidth: 4
      }
    },
    {
      files: "*.css",
      options: {
        tabWidth: 4
      }
    }
  ]
};

export default config;
