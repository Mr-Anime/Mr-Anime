/// <reference types="astro/client" />

interface Env {
  DB: D1Database;
  PLAYER_EMBED_BASE_URL?: string;
}

declare namespace App {
  interface Locals {
    runtime: {
      env: Env;
      ctx: ExecutionContext;
    };
  }
}
