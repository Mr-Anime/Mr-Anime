import { getCloudflareContext } from "@opennextjs/cloudflare";

export interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
  error?: string;
  meta: Record<string, unknown>;
}

export interface D1ExecResult {
  count: number;
  duration: number;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run<T = unknown>(): Promise<D1Result<T>>;
  all<T = unknown>(): Promise<D1Result<T>>;
  raw<T = unknown>(): Promise<T[]>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  dump(): Promise<ArrayBuffer>;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<D1ExecResult>;
}

/**
 * Retrieve the Cloudflare D1 database binding from the runtime environment.
 */
export async function getD1Binding(bindingName = "DB"): Promise<D1Database | null> {
  try {
    const cfContext = await getCloudflareContext();
    if (cfContext?.env && (cfContext.env as Record<string, unknown>)[bindingName]) {
      return (cfContext.env as Record<string, unknown>)[bindingName] as D1Database;
    }
  } catch {
    // getCloudflareContext may fail if called outside Cloudflare worker runtime (e.g. build time or node dev without context)
  }

  // Fallback check on global context or process.env if injected
  const globalObj = globalThis as Record<string, unknown>;
  if (globalObj[bindingName]) {
    return globalObj[bindingName] as D1Database;
  }

  const procEnv = process.env as Record<string, unknown>;
  if (procEnv[bindingName]) {
    return procEnv[bindingName] as D1Database;
  }

  return null;
}

/**
 * Execute a DQL (SELECT) or parameterised query on D1 database.
 */
export async function queryD1<T = unknown>(
  sql: string,
  params: unknown[] = [],
  bindingName = "DB"
): Promise<D1Result<T>> {
  const db = await getD1Binding(bindingName);
  if (!db) {
    throw new Error(`D1 database binding "${bindingName}" is not available in the current environment.`);
  }

  const stmt = db.prepare(sql);
  const bound = params.length > 0 ? stmt.bind(...params) : stmt;
  return bound.all<T>();
}

/**
 * Execute a query and return the first matching row or value.
 */
export async function queryD1First<T = unknown>(
  sql: string,
  params: unknown[] = [],
  bindingName = "DB"
): Promise<T | null> {
  const db = await getD1Binding(bindingName);
  if (!db) {
    throw new Error(`D1 database binding "${bindingName}" is not available in the current environment.`);
  }

  const stmt = db.prepare(sql);
  const bound = params.length > 0 ? stmt.bind(...params) : stmt;
  return bound.first<T>();
}

/**
 * Execute raw SQL script (e.g., multi-statement SQL schema/DDL).
 */
export async function executeD1(
  sql: string,
  bindingName = "DB"
): Promise<D1ExecResult> {
  const db = await getD1Binding(bindingName);
  if (!db) {
    throw new Error(`D1 database binding "${bindingName}" is not available in the current environment.`);
  }

  return db.exec(sql);
}

/**
 * Execute batch prepared statements in a single transaction.
 */
export async function batchD1<T = unknown>(
  statements: { sql: string; params?: unknown[] }[],
  bindingName = "DB"
): Promise<D1Result<T>[]> {
  const db = await getD1Binding(bindingName);
  if (!db) {
    throw new Error(`D1 database binding "${bindingName}" is not available in the current environment.`);
  }

  const prepared = statements.map(({ sql, params = [] }) => {
    const stmt = db.prepare(sql);
    return params.length > 0 ? stmt.bind(...params) : stmt;
  });

  return db.batch<T>(prepared);
}
