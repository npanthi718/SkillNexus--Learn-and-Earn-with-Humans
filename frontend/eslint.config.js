const reactHooks = {
  rules: {
    "exhaustive-deps": {
      meta: {
        type: "problem",
        docs: { description: "noop for compatibility with inline disables" },
        schema: []
      },
      create() {
        return {};
      }
    }
  }
};

export default [
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        ecmaFeatures: { jsx: true }
      }
    },
    plugins: {
      "react-hooks": reactHooks
    },
    rules: {
      "react-hooks/exhaustive-deps": "off"
    }
  }
];
