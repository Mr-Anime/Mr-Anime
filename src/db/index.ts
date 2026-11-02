import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

// For local dev without binding, fall back to better-sqlite3 if available
let _db: any;
export const db = _db;
