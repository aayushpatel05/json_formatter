module.exports = {
  plugins: ["prettier-plugin-sql"],
  overrides: [
    {
      files: ["*.sql", "*.psql"],
      options: {
        parser: "sql",
        sqlFormatOptions: {
          language: "sql", // Options: sql, mysql, postgresql
          keywordCase: "uppercase", // Options: lowercase, uppercase
          indentStyle: "standard", // Options: standard, tabularLeft, tabularRight
          logicalOperatorNewline: "before", // Options: before, after
          linesBetweenQueries: 2,
        },
      },
    },
  ],
};
