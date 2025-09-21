import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
  { files: ["**/*.{js,mjs,cjs,ts,mts,cts}"], plugins: { js }, extends: ["js/recommended"], languageOptions: { globals: globals.browser } },
  { files: ["**/*.{js,mjs,cjs,ts,mts,cts}"], plugins: { tseslint }, extends: ["plugin:@typescript-eslint/recommended"], languageOptions: { parser: tseslint.parser } },
]);
