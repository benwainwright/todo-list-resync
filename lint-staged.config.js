/**
 * @filename: lint-staged.config.js
 * @type {import('lint-staged').Configuration}
 */
export default {
  "*.{ts,js,json,md}": "bunx --bun prettier --write",
};
