import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { readdirSync } from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const MIGRATIONS_DIR = resolve(__dirname, "migrations");

/**
 * Returns an ordered list of migration file paths.
 */
export function getMigrationFiles(): string[] {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  return files.map((f) => join(MIGRATIONS_DIR, f));
}

/**
 * Returns an ordered list of migration file names (without path).
 */
export function getMigrationNames(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
}
