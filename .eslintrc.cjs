module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
  plugins: ["@typescript-eslint", "react-hooks"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
  ],
  ignorePatterns: [
    "build/",
    "dist/",
    ".react-router/",
    "node_modules/",
    "services/upv/",
    "public/pagefind/",
    "public/posts/",
    "public/og/posts/",
  ],
  rules: {
    // TypeScript already resolves globals and unused declarations; the core
    // rules produce false positives on type-only syntax.
    "no-undef": "off",
    // The remark/rehype pipeline walks untyped unist/hast nodes; `any` is the
    // honest type at that boundary until proper AST type packages are added.
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": [
      "warn",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],
  },
};
